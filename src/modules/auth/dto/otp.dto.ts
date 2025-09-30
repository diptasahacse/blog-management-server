import { IsEnum, IsOptional, IsUUID, Length } from 'class-validator';
import { OtpChannelEnum, OtpPurposeEnum } from '../enums/otp.enum';
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
}

export class ResendOtpDto {
  @IsUUID()
  userId: string;

  @IsEnum(OtpPurposeEnum)
  purpose: OtpPurposeEnum;

  @IsEnum(OtpChannelEnum)
  channel: OtpChannelEnum;
}
