import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
