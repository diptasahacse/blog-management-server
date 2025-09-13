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
import { ConflictChecker, UniqueField } from '../../shared/utils';

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
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, name, role } = registerDto;

    // Define unique fields to check
    const uniqueFields: UniqueField[] = [
      {
        field: 'email',
        value: email,
        message: 'User with this email already exists',
      },
      // You can easily add more unique fields here:
      {
        field: 'username',
        value: name,
        message: 'Username is already taken',
      },
      // {
      //   field: 'phone',
      //   value: phone,
      //   message: 'Phone number is already registered',
      // },
    ];

    // Define corresponding check functions
    const checkFunctions = [
      async (emailValue: string) => {
        const existingUser = await this.userService.findByEmail(emailValue);
        return !!existingUser;
      },
      // Add more check functions for other unique fields:
      // async (usernameValue: string) => {
      //   const existingUser = await this.userService.findByUsername(usernameValue);
      //   return !!existingUser;
      // },
      // async (phoneValue: string) => {
      //   const existingUser = await this.userService.findByPhone(phoneValue);
      //   return !!existingUser;
      // },
    ];

    // Check for conflicts and throw if any exist
    await ConflictChecker.checkAndThrowConflicts(uniqueFields, checkFunctions);

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.userService.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'user',
    });

    // Generate tokens
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
