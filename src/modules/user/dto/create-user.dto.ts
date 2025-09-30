import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
