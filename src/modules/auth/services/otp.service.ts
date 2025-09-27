import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gt, lt } from 'drizzle-orm';
import { DrizzleProvider } from '../../../core/database';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../core/database/schemas';
import { OtpTable } from '../../../core/database/schemas/otp.schema';

export interface CreateOtpDto {
  email: string;
  purpose:
    | 'register'
    | 'reset_password'
    | 'email_verification'
    | 'login_verification';
}

export interface OtpVerificationResult {
  isValid: boolean;
  email?: string;
  purpose?: string;
  additionalInfo?: string;
}

@Injectable()
export class OtpService {
  constructor(
    @Inject(DrizzleProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Generate a 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create and store a new OTP
   */
  async createOtp(createOtpDto: CreateOtpDto): Promise<string> {
    const { email, purpose } = createOtpDto;

    // Generate 6-digit code
    const code = this.generateOtpCode();

    // Set expiry time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Invalidate any existing unused OTPs for the same email and purpose
    await this.db
      .update(OtpTable)
      .set({ used: true, updatedAt: new Date() })
      .where(
        and(
          eq(OtpTable.email, email),
          eq(OtpTable.purpose, purpose),
          eq(OtpTable.used, false),
        ),
      );

    // Create new OTP
    await this.db.insert(OtpTable).values({
      code,
      email,
      purpose,
      used: false,
      expiresAt,
    });

    return code;
  }

  /**
   * Verify an OTP code
   */
  async verifyOtp(
    code: string,
    email: string,
    purpose: string,
  ): Promise<OtpVerificationResult> {
    const now = new Date();

    // Find valid OTP
    const [otp] = await this.db
      .select()
      .from(OtpTable)
      .where(
        and(
          eq(OtpTable.code, code),
          eq(OtpTable.email, email),
          eq(OtpTable.purpose, purpose as any),
          eq(OtpTable.used, false),
          gt(OtpTable.expiresAt, now),
        ),
      )
      .limit(1);

    if (!otp) {
      return { isValid: false };
    }

    // Mark OTP as used
    await this.db
      .update(OtpTable)
      .set({ used: true, updatedAt: new Date() })
      .where(eq(OtpTable.id, otp.id));

    return {
      isValid: true,
      email: otp.email,
      purpose: otp.purpose,
      additionalInfo: otp.additionalInfo || undefined,
    };
  }

  /**
   * Verify OTP by code only (for GET endpoint)
   */
  async verifyOtpByCode(code: string): Promise<OtpVerificationResult> {
    const now = new Date();

    // Find valid OTP by code only
    const [otp] = await this.db
      .select()
      .from(OtpTable)
      .where(
        and(
          eq(OtpTable.code, code),
          eq(OtpTable.used, false),
          gt(OtpTable.expiresAt, now),
        ),
      )
      .limit(1);

    if (!otp) {
      return { isValid: false };
    }

    // Mark OTP as used
    await this.db
      .update(OtpTable)
      .set({ used: true, updatedAt: new Date() })
      .where(eq(OtpTable.id, otp.id));

    return {
      isValid: true,
      email: otp.email,
      purpose: otp.purpose,
      additionalInfo: otp.additionalInfo || undefined,
    };
  }

  /**
   * Clean up expired OTPs (can be run as a cron job)
   */
  async cleanupExpiredOtps(): Promise<number> {
    const now = new Date();

    const result = await this.db
      .delete(OtpTable)
      .where(lt(OtpTable.expiresAt, now));

    return result.rowCount || 0;
  }

  /**
   * Check if an email has any pending OTPs for a specific purpose
   */
  async hasPendingOtp(email: string, purpose: string): Promise<boolean> {
    const now = new Date();

    const [pendingOtp] = await this.db
      .select({ id: OtpTable.id })
      .from(OtpTable)
      .where(
        and(
          eq(OtpTable.email, email),
          eq(OtpTable.purpose, purpose as any),
          eq(OtpTable.used, false),
          gt(OtpTable.expiresAt, now),
        ),
      )
      .limit(1);

    return !!pendingOtp;
  }
}
