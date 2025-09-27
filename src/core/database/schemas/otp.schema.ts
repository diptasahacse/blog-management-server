import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { UserTable } from './user.schema';

// Define enum for OTP purposes
export const otpPurposeEnum = pgEnum('otp_purpose', [
  'register',
  'reset_password',
  'email_verification',
  'login_verification',
  'two_factor_auth',
]);

export const otpMediumEnum = pgEnum('otp_medium', ['email', 'sms']);

export const OtpTable = pgTable('otp', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => UserTable.id)
    .notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  medium: otpMediumEnum('medium').notNull(),
  purpose: otpPurposeEnum('purpose').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  expiredAt: timestamp('expired_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
