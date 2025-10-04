const config = {
  password: {
    SALT_ROUNDS: 12,
  },
  otp: {
    MAX_OTP_RETRY: 3,
    OTP_EXPIRY_MINUTES: 15,
    HASHED_OTP_ALGORITHM: 'sha256',
    OTP_LENGTH: 6,
  },
};
export default config;
