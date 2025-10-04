import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/^(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/^(?=.*\d)/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/^(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~])/, {
    message: 'Password must contain at least one special character',
  })
  @Matches(/^[^\s]+$/, {
    message: 'Password must not contain spaces',
  })
  password: string;
}
