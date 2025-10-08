import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DrizzleProvider } from '../../../core/database';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../core/database/schemas';
import { OtpTable } from '../../../core/database/schemas/otp.schema';
import { GenerateOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import { OtpStatusEnum } from '../enums/otp.enum';
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
   * Generate a N-digit OTP code
   */
  private generateNDigitOtp(): string {
    return crypto
      .randomInt(0, Math.pow(10, config.otp.OTP_LENGTH))
      .toString()
      .padStart(config.otp.OTP_LENGTH, '0');
  }

  /**
   * Hash OTP code
   */
  async hashedOtp(otp: string): Promise<string> {
    return await bcrypt.hash(otp, config.otp.SALT_ROUND);
  }

  /**
   * Create and store a new OTP
   */
  async generateOTP(createOtpDto: GenerateOtpDto): Promise<string> {
    const { purpose, channel, userId } = createOtpDto;

    //  Invalidate old OTP if exist for the same purpose
    await this.db
      .update(OtpTable)
      .set({
        status: OtpStatusEnum.EXPIRED,
      })
      .where(
        and(
          eq(OtpTable.userId, userId),
          eq(OtpTable.purpose, purpose),
          eq(OtpTable.channel, channel),
        ),
      );

    // Generate OTP code
    const code = this.generateNDigitOtp();

    //  Hash OTP code
    const hashedCode = await this.hashedOtp(code);

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
  async verifyOTP(dto: VerifyOtpDto) {
    const { userId, otpCode, purpose, channel } = dto;

    const otp = await this.db.query.OtpTable.findFirst({
      where: and(
        eq(OtpTable.userId, userId),
        eq(OtpTable.purpose, purpose),
        eq(OtpTable.channel, channel),
        eq(OtpTable.status, OtpStatusEnum.PENDING),
      ),
      orderBy: [desc(OtpTable.createdAt)],
    });
    //  If no OTP found, throw exception
    if (!otp) {
      throw new BadRequestException('No OTP found. Request a new one.');
    }

    // Check max retry. If exceeded, block the OTP and throw exception
    if (otp.retryCount >= config.otp.MAX_OTP_RETRY) {
      await this.db
        .update(OtpTable)
        .set({ status: OtpStatusEnum.BLOCKED })
        .where(eq(OtpTable.id, otp.id));
      throw new BadRequestException('OTP blocked due to max retry attempts');
    }

    // Check if OTP is expired. If expired, expire the OTP and throw exception
    if (new Date() > new Date(otp.expireAt)) {
      await this.db
        .update(OtpTable)
        .set({ status: OtpStatusEnum.EXPIRED })
        .where(eq(OtpTable.id, otp.id));
      throw new BadRequestException('OTP expired. Request a new one.');
    }
    //  If Wrong OTP, increment retry count and throw exception
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
    //  If OTP is correct, mark it as USED
    await this.db
      .update(OtpTable)
      .set({
        status: OtpStatusEnum.USED,
      })
      .where(eq(OtpTable.id, otp.id));

    return true;
  }

  // Check if the provided OTP matches the hashed OTP
  async isValidOTP(plainOTP: string, hashedOTP: string): Promise<boolean> {
    return await bcrypt.compare(plainOTP, hashedOTP);
  }
}
