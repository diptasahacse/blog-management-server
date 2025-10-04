import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DrizzleProvider } from '../../../core/database';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../core/database/schemas';
import { OtpTable } from '../../../core/database/schemas/otp.schema';
import { GenerateOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import { OtpStatusEnum } from '../enums/otp.enum';
import crypto from 'crypto';
import config from 'src/config';
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
   * Generate a 6-digit OTP code
   */
  private generateOtp(length = config.otp.OTP_LENGTH): string {
    return crypto
      .randomInt(0, Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

  /**
   * Hash OTP code
   */
  hashOtp(otp: string): string {
    return crypto
      .createHash(config.otp.HASHED_OTP_ALGORITHM)
      .update(otp)
      .digest('hex');
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
    const code = this.generateOtp();

    //  Hash OTP code
    const hashedCode = this.hashOtp(code);

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
        eq(OtpTable.otpCode, otpCode),
        eq(OtpTable.channel, channel),
        eq(OtpTable.status, OtpStatusEnum.PENDING),
      ),
    });
    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }
    if (otp.expireAt.getTime() < Date.now()) {
      // Expire the OTP
      await this.db
        .update(OtpTable)
        .set({ status: OtpStatusEnum.EXPIRED })
        .where(eq(OtpTable.id, otp.id));
      throw new BadRequestException('OTP has expired');
    }
    //
    const isMatch = otp.otpCode === otpCode;
    if (!isMatch) {
      throw new BadRequestException('Invalid OTP');
    }

    // ✅ OTP successful হলে update করো
    await this.db
      .update(OtpTable)
      .set({ status: OtpStatusEnum.USED, updatedAt: new Date() })
      .where(eq(OtpTable.id, otp.id));

    return true;
  }
}
