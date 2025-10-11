import { IsEmail, IsEnum, IsOptional, IsUUID, Length } from 'class-validator';
import { OtpChannelEnum, OtpPurposeEnum } from '../enums/otp.enum';
import { OmitType } from '@nestjs/mapped-types';
import config from 'src/config';
export class GenerateOtpDto {
  @IsUUID()
  userId: string;

  @IsEnum(OtpPurposeEnum)
  purpose: OtpPurposeEnum;

  @IsOptional()
  @IsEnum(OtpChannelEnum)
  channel: OtpChannelEnum;
}
// Verify OTP
export class VerifyOtpDto {
  @IsUUID()
  userId: string;

  @Length(config.otp.OTP_LENGTH, config.otp.OTP_LENGTH)
  otpCode: string;

  @IsEnum(OtpPurposeEnum)
  purpose: OtpPurposeEnum;

  @IsEnum(OtpChannelEnum)
  channel: OtpChannelEnum;
}
export class VerifyOtpRequestBodyDTO {
  @IsEmail()
  email: string;
}
export class VerifyRequestBodyDTO {
  @IsEmail()
  email: string;
}
export class VerifyOtpParamsDTO {
  @Length(config.otp.OTP_LENGTH, config.otp.OTP_LENGTH)
  code: string;

  @IsEnum(OtpPurposeEnum)
  purpose: OtpPurposeEnum;

  @IsEnum(OtpChannelEnum)
  channel: OtpChannelEnum;
}
export class SendOtpParamsDTO {
  @IsEnum(OtpPurposeEnum)
  purpose: OtpPurposeEnum;

  @IsEnum(OtpChannelEnum)
  channel: OtpChannelEnum;
}

// Verify OTP for registration
export class VerifyOtpForRegistrationDto extends OmitType(VerifyOtpDto, [
  'userId',
  'purpose',
] as const) {
  @IsEmail()
  email: string;
}
// Resend OTP for registration
export class ResendOtpForRegistrationDto extends OmitType(VerifyOtpDto, [
  'userId',
  'purpose',
  'otpCode',
] as const) {
  @IsEmail()
  email: string;
}
