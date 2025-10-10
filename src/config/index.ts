import otpConfig from './otp';

const config = {
  password: {
    SALT_ROUNDS: 12,
  },
  otp: otpConfig,
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
