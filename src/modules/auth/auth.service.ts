import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  AuthResponse,
  JwtPayload,
  TokenPair,
} from './interfaces/auth.interface';
import { OtpService } from './services/otp.service';
import { OtpChannelEnum, OtpPurposeEnum } from './enums/otp.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationChannelEnum } from '../notification/enum/notification-channel.enum';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  password?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private notificationService: NotificationService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ message: string; email: string }> {
    const { email, password, name } = registerDto;

    // // Define unique fields to check
    // const uniqueFields: UniqueField[] = [
    //   {
    //     field: 'email',
    //     value: email,
    //     message: 'User with this email already exists',
    //   },
    //   // You can easily add more unique fields here:
    //   {
    //     field: 'username',
    //     value: name,
    //     message: 'Username is already taken',
    //   },
    //   // {
    //   //   field: 'phone',
    //   //   value: phone,
    //   //   message: 'Phone number is already registered',
    //   // },
    // ];

    // // Define corresponding check functions
    // const checkFunctions = [
    //   async (emailValue: string) => {
    //     const existingUser = await this.userService.findByEmail(emailValue);
    //     return !!existingUser;
    //   },
    //   // Add more check functions for other unique fields:
    //   // async (usernameValue: string) => {
    //   //   const existingUser = await this.userService.findByUsername(usernameValue);
    //   //   return !!existingUser;
    //   // },
    //   // async (phoneValue: string) => {
    //   //   const existingUser = await this.userService.findByPhone(phoneValue);
    //   //   return !!existingUser;
    //   // },
    // ];

    // // Check for conflicts and throw if any exist
    // await ConflictChecker.checkAndThrowConflicts(uniqueFields, checkFunctions);

    // Check if user already exists and is verified
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser && existingUser.verifiedAt) {
      throw new BadRequestException(
        'User with this email is already registered',
      );
    }

    // If user exists but is not verified, we can choose to resend OTP or update details
    if (existingUser) {
      const otpCode = await this.otpService.generateOTP({
        purpose: OtpPurposeEnum.REGISTER,
        channel: OtpChannelEnum.EMAIL,
        userId: existingUser.id,
      });
      await this.notificationService.sendNotification({
        channel: NotificationChannelEnum.EMAIL,
        email: {
          to: existingUser.email,
          subject: 'Verify your email address',
          template: 'verify-email',
          context: {
            name: existingUser.name,
            otpCode: otpCode,
            year: new Date().getFullYear(),
          },
        },
      });
      return {
        message:
          'User is registered but not verified. A new verification link has been sent to your email.',
        email,
      };
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    //  Store user data
    const user = await this.userService.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate and store OTP
    const otpCode = await this.otpService.generateOTP({
      purpose: OtpPurposeEnum.REGISTER,
      channel: OtpChannelEnum.EMAIL,
      userId: user.id,
    });

    await this.notificationService.sendNotification({
      channel: NotificationChannelEnum.EMAIL,
      email: {
        to: user.email,
        subject: 'Verify your email address',
        template: 'verify-email',
        context: {
          name: user.name,
          otpCode: otpCode,
          year: new Date().getFullYear(),
        },
      },
    });

    return {
      message:
        'Registration initiated. Please check your email for verification link.',
      email,
    };
  }

  // async verifyRegistrationOtp(otpCode: string): Promise<AuthResponse> {
  //   // Verify OTP
  //   const otpResult = await this.otpService.verifyOtpByCode(otpCode);

  //   if (!otpResult.isValid || otpResult.purpose !== 'register') {
  //     throw new BadRequestException('Invalid or expired OTP code');
  //   }

  //   if (!otpResult.additionalInfo) {
  //     throw new BadRequestException('Registration data not found');
  //   }

  //   // Parse stored user data with type safety
  //   const temporaryUserData = JSON.parse(otpResult.additionalInfo) as {
  //     email: string;
  //     password: string;
  //     name: string;
  //     role: 'admin' | 'user';
  //   };

  //   // Check if user already exists (in case of race condition)
  //   const existingUser = await this.userService.findByEmail(
  //     temporaryUserData.email,
  //   );
  //   if (existingUser) {
  //     throw new BadRequestException('User already exists');
  //   }

  //   // Create user
  //   const user = await this.userService.create({
  //     email: temporaryUserData.email,
  //     password: temporaryUserData.password,
  //     name: temporaryUserData.name,
  //     role: temporaryUserData.role,
  //   });

  //   // Generate tokens
  //   const tokens = await this.generateTokens(user.id, user.email, user.role);

  //   return {
  //     ...tokens,
  //     user: {
  //       id: user.id,
  //       email: user.email,
  //       name: user.name,
  //       role: user.role,
  //     },
  //   };
  // }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.verifiedAt) {
        throw new BadRequestException('User not verified');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result as User;
    }
    return null;
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const payload: JwtPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userService.findUserWithPassword(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.userService.updatePassword(userId, hashedNewPassword);

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
