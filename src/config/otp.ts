const otpConfig = {
  MAX_OTP_RETRY: 3,
  OTP_EXPIRY_MINUTES: 15,
  OTP_LENGTH: 6,
  SALT_ROUND: 10,
  MIN_RESEND_INTERVAL_SECONDS: 60,
};

export default otpConfig;
