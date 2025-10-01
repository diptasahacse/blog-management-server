import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { UserTable } from './user.schema';
import { integer } from 'drizzle-orm/pg-core';
import {
  OtpChannelEnum,
  OtpPurposeEnum,
  OtpStatusEnum,
} from 'src/modules/auth/enums/otp.enum';
import { serial } from 'drizzle-orm/pg-core';

// Define enum for OTP purposes
export const otpPurposeEnum = pgEnum('otp_purpose', [
  OtpPurposeEnum.REGISTER,
  OtpPurposeEnum.RESET_PASSWORD,
  OtpPurposeEnum.EMAIL_VERIFICATION,
  OtpPurposeEnum.LOGIN_VERIFICATION,
  OtpPurposeEnum.TWO_FACTOR_AUTH,
]);
// Define enum for OTP status
export const otpStatusEnum = pgEnum('otp_status', [
  OtpStatusEnum.PENDING,
  OtpStatusEnum.USED,
  OtpStatusEnum.EXPIRED,
  OtpStatusEnum.BLOCKED,
]);

// Define enum for OTP channel
export const otpChannelEnum = pgEnum('otp_channel', [
  OtpChannelEnum.EMAIL,
  OtpChannelEnum.SMS,
  OtpChannelEnum.WHATSAPP,
]);

export const OtpTable = pgTable('otp', {
  id: serial('id').primaryKey(), // Primary key
  userId: uuid()
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(), // Reference to User table
  otpCode: varchar('code', { length: 6 }).notNull(), // 6-digit OTP code
  purpose: otpPurposeEnum('purpose').notNull(), // Purpose of the OTP
  status: otpStatusEnum('status').notNull().default(OtpStatusEnum.PENDING), // Status of the OTP
  expireAt: timestamp('expire_at', { withTimezone: true }).notNull(), // Expiry time
  channel: otpChannelEnum('channel').notNull().default(OtpChannelEnum.EMAIL), // Channel through which OTP is sent
  retryCount: integer('retry_count').default(0), // Number of retry attempts
  createdAt: timestamp('created_at').notNull().defaultNow(), // Creation timestamp
  updatedAt: timestamp('updated_at').notNull().defaultNow(), // Last update timestamp
});
