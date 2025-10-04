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
  channel: OtpChannelEnum = OtpChannelEnum.EMAIL;
}
export class VerifyOtpDto {
  @IsUUID()
  userId: string;

  @Length(config.otp.OTP_LENGTH, config.otp.OTP_LENGTH)
  otpCode: string;

  @IsEnum(OtpPurposeEnum)
  purpose: OtpPurposeEnum;

  @IsOptional()
  @IsEnum(OtpChannelEnum)
  channel: OtpChannelEnum = OtpChannelEnum.EMAIL;
}

// Verify OTP for registration
export class VerifyOtpRegistrationDto extends OmitType(VerifyOtpDto, [
  'userId',
] as const) {
  @IsEmail()
  email: string;
}

export class ResendOtpDto {
  @IsUUID()
  userId: string;

  @IsEnum(OtpPurposeEnum)
  purpose: OtpPurposeEnum;

  @IsEnum(OtpChannelEnum)
  channel: OtpChannelEnum;
}
