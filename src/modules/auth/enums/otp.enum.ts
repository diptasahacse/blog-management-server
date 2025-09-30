export enum OtpPurposeEnum {
  REGISTER = 'register',
  RESET_PASSWORD = 'reset_password',
  EMAIL_VERIFICATION = 'email_verification',
  LOGIN_VERIFICATION = 'login_verification',
  TWO_FACTOR_AUTH = 'two_factor_auth',
}
export enum OtpStatusEnum {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired',
  BLOCKED = 'blocked',
}
export enum OtpChannelEnum {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}
