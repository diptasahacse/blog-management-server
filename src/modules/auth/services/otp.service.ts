import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DrizzleProvider } from '../../../core/database';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../core/database/schemas';
import { OtpTable } from '../../../core/database/schemas/otp.schema';
import { GenerateOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import { OtpPurposeEnum, OtpStatusEnum } from '../enums/otp.enum';
import crypto from 'crypto';
import config from 'src/config';
import * as bcrypt from 'bcrypt';
export interface OtpVerificationResult {
  isValid: boolean;
  email?: string;
  purpose?: string;
  additionalInfo?: string;
}

@Injectable()
export class OtpService {
  private readonly otpExpiry = config.otp.OTP_EXPIRY_MINUTES * 60 * 1000; // OTP expiry time in milliseconds
  private readonly maxRetry = config.otp.MAX_OTP_RETRY; // Max retry attempts
  constructor(
    @Inject(DrizzleProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * create a N-digit OTP code
   */
  private createOTP(length: number = config.otp.OTP_LENGTH): string {
    return crypto
      .randomInt(0, Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

  /**
   * Hash OTP code
   */
  private async hashOtp(otp: string): Promise<string> {
    return await bcrypt.hash(otp, config.otp.SALT_ROUND);
  }

  private getMinResendIntervalByPurpose(purpose: OtpPurposeEnum): number {
    let resendIntervalSeconds = config.otp.MIN_RESEND_INTERVAL_SECONDS;
    if (purpose === OtpPurposeEnum.REGISTER) {
      resendIntervalSeconds = config.otp.MIN_RESEND_INTERVAL_SECONDS;
    }

    return resendIntervalSeconds * 1000;
  }

  /**
   * Create and store a new OTP
   */
  async generateOTP(createOtpDto: GenerateOtpDto): Promise<string> {
    const { purpose, channel, userId } = createOtpDto;

    // 1️⃣ Check if user already has a pending OTP for the same purpose and channel
    const lastOtp = await this.db.query.OtpTable.findFirst({
      where: and(
        eq(OtpTable.userId, userId),
        eq(OtpTable.purpose, purpose),
        eq(OtpTable.channel, channel),
        eq(OtpTable.status, OtpStatusEnum.PENDING),
      ),
      orderBy: [desc(OtpTable.createdAt)],
    });

    if (lastOtp) {
      // Calculate time since last OTP was created
      const timeSinceLastOtp =
        Date.now() - new Date(lastOtp.createdAt).getTime();

      // If last OTP is still valid and within resend interval, throw exception
      if (timeSinceLastOtp < this.getMinResendIntervalByPurpose(purpose)) {
        const waitTime = Math.ceil(
          (this.getMinResendIntervalByPurpose(purpose) - timeSinceLastOtp) /
            1000,
        );
        throw new BadRequestException(
          `Please wait ${waitTime}s before requesting another OTP.`,
        );
      }

      // Expire the last pending OTP before generating a new one
      await this.db
        .update(OtpTable)
        .set({ status: OtpStatusEnum.EXPIRED })
        .where(eq(OtpTable.id, lastOtp.id));
    }

    // Create OTP code
    const code = this.createOTP();

    //  Hash OTP code
    const hashedCode = await this.hashOtp(code);

    // Create new OTP
    await this.db.insert(OtpTable).values({
      userId,
      otpCode: hashedCode,
      purpose,
      channel,
      expireAt: new Date(Date.now() + this.otpExpiry),
    });

    return code;
  }

  // Verify OTP
  async verifyOTP(dto: VerifyOtpDto): Promise<boolean> {
    const { userId, otpCode, purpose, channel } = dto;

    // 1️⃣ Fetch latest pending OTP for this user with purpose, and channel
    const otp = await this.db.query.OtpTable.findFirst({
      where: and(
        eq(OtpTable.userId, userId),
        eq(OtpTable.purpose, purpose),
        eq(OtpTable.channel, channel),
        eq(OtpTable.status, OtpStatusEnum.PENDING),
      ),
      orderBy: [desc(OtpTable.createdAt)],
    });
    // 2️⃣ No pending OTP found - If no OTP found, throw exception
    if (!otp) {
      throw new BadRequestException('No OTP found. Request a new one.');
    }

    // 3️⃣ Check max retry - Check max retry. If exceeded, block the OTP and throw exception
    if (otp.retryCount >= config.otp.MAX_OTP_RETRY) {
      await this.db
        .update(OtpTable)
        .set({ status: OtpStatusEnum.BLOCKED })
        .where(eq(OtpTable.id, otp.id));
      throw new BadRequestException('OTP blocked due to max retry attempts');
    }

    // 4️⃣ Check expiry - Check if OTP is expired. If expired, expire the OTP and throw exception
    if (new Date() > new Date(otp.expireAt)) {
      await this.db
        .update(OtpTable)
        .set({ status: OtpStatusEnum.EXPIRED })
        .where(eq(OtpTable.id, otp.id));
      throw new BadRequestException('OTP expired. Request a new one.');
    }
    // 5️⃣ Verify OTP (hashed comparison) - If Wrong OTP, increment retry count and throw exception
    const validOTP = await this.isValidOTP(otpCode, otp.otpCode);
    if (!validOTP) {
      await this.db
        .update(OtpTable)
        .set({ retryCount: otp.retryCount + 1 })
        .where(eq(OtpTable.id, otp.id));
      throw new BadRequestException(
        `Wrong OTP. Attempt ${otp.retryCount + 1}/${config.otp.MAX_OTP_RETRY}`,
      );
    }
    // 6️⃣ Mark OTP as USED - If OTP is correct, mark it as USED
    await this.db
      .update(OtpTable)
      .set({
        status: OtpStatusEnum.USED,
      })
      .where(eq(OtpTable.id, otp.id));

    // ✅ OTP is valid
    return true;
  }

  // Check if the provided OTP matches the hashed OTP
  private async isValidOTP(
    plainOTP: string,
    hashedOTP: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainOTP, hashedOTP);
  }
}
