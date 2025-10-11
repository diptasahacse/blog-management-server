import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Param,
  BadRequestException,
  // Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GetUser } from './decorators/get-user.decorator';
import { Roles } from './decorators/roles.decorator';
import {
  VerifyOtpRequestBodyDTO,
  VerifyOtpParamsDTO,
  VerifyRequestBodyDTO,
  SendOtpParamsDTO,
} from './dto/otp.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { OtpPurposeEnum } from './enums/otp.enum';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({
    otp: {},
  })
  @Post('verify-otp/:purpose/:channel/:code')
  verifyOTP(
    @Body() dto: VerifyOtpRequestBodyDTO,
    @Param() params: VerifyOtpParamsDTO,
  ) {
    const { channel, purpose, code } = params;
    const { email } = dto;
    switch (purpose) {
      case OtpPurposeEnum.REGISTER:
        return this.authService.verifyRegistrationOtp({
          email,
          channel,
          otpCode: code,
        });
      default:
        throw new BadRequestException('Invalid purpose or not supported yet');
    }
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({
    otp: {},
  })
  @Post('send-otp/:purpose/:channel')
  async resendRegistrationOtp(
    @Body() dto: VerifyRequestBodyDTO,
    @Param() params: SendOtpParamsDTO,
  ) {
    const { channel, purpose } = params;
    const { email } = dto;
    switch (purpose) {
      case OtpPurposeEnum.REGISTER:
        return this.authService.resendRegistrationOtp({
          email,
          channel,
        });
      default:
        throw new BadRequestException('Invalid purpose or not supported yet');
    }
  }
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user: AuthenticatedUser) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @GetUser() user: AuthenticatedUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin-only')
  adminOnly() {
    return { message: 'This is an admin-only endpoint!' };
  }
}
