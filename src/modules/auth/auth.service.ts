import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
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
import { VerifyOtpForRegistrationDto } from './dto/otp.dto';
import config from 'src/config';

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

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password, name } = registerDto;

    // 1. Check if email is already exists or not
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      // If user exists but is not verified, then throw exception to prompt for OTP resend
      if (!existingUser.verifiedAt) {
        throw new ConflictException(
          'User already registered but not verified. Resend OTP.',
        );
      }
      // If user exists and is verified, throw conflict exception
      throw new ConflictException('Email already in use.');
    }

    // 2. Create new user
    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      config.password.SALT_ROUNDS,
    );
    //  Store user data
    const user = await this.userService.create({
      name,
      email,
      password: hashedPassword,
    });

    // 3. Generate, store and send OTP
    //  Generate and store OTP
    const otpCode = await this.otpService.generateOTP({
      purpose: OtpPurposeEnum.REGISTER,
      channel: OtpChannelEnum.EMAIL,
      userId: user.id,
    });
    // Send OTP to user
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
      message: 'Registration successful. Check email for OTP.',
    };
  }

  async verifyRegistrationOtp(
    dto: VerifyOtpForRegistrationDto,
  ): Promise<{ message: string }> {
    const { email, channel } = dto;
    // 1️⃣ Find the user
    const userData = await this.userService.findByEmail(email);
    if (!userData) {
      throw new BadRequestException('User not found');
    }
    // 2️⃣ Already verified?
    if (userData.verifiedAt) {
      throw new BadRequestException('User already verified');
    }

    // 3️⃣ Verify OTP
    const isValid = await this.otpService.verifyOTP({
      userId: userData.id,
      otpCode: dto.otpCode,
      purpose: OtpPurposeEnum.REGISTER,
      channel: channel,
    });

    // 4️⃣ Invalid OTP
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // 5️⃣ Mark user as verified
    await this.userService.markAsVerified(userData.id);

    return {
      message: 'User verified successfully',
    };
  }

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
