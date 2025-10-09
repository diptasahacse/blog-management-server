const config = {
  password: {
    SALT_ROUNDS: 12,
  },
  otp: {
    MAX_OTP_RETRY: 3,
    OTP_EXPIRY_MINUTES: 15,
    OTP_LENGTH: 6,
    SALT_ROUND: 10,
  },
  rateLimit: {
    default: {
      TTL_IN_SECONDS: 60,
      REQUEST_LIMIT: 10,
    },
    otp: {
      TTL_IN_SECONDS: 10,
      REQUEST_LIMIT: 3,
    },
  },
};
export default config;
