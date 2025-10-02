import { IsEmail, IsEnum, IsOptional, IsUUID, Length } from 'class-validator';
import { OtpChannelEnum, OtpPurposeEnum } from '../enums/otp.enum';
import { OmitType } from '@nestjs/mapped-types';
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

  @Length(6, 6)
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
