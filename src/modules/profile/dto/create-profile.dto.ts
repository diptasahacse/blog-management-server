import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateProfileDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
