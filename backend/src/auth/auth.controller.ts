import {
  Controller,
  Post,
  Body,
  UseGuards,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RedisService } from '../redis/redis.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private redisService: RedisService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes (900 seconds)
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiBody({ type: SendOtpDto })
  async sendOtp(@Body() sendOtpDto: SendOtpDto, @Ip() ipAddress: string) {
    // Additional rate limiting by phone number (more restrictive than IP-based)
    const phoneRateLimitKey = `rate_limit:send_otp:${sendOtpDto.phone}`;
    const phoneCount = await this.redisService.get(phoneRateLimitKey);
    
    if (phoneCount && parseInt(phoneCount, 10) >= 3) {
      throw new BadRequestException('Too many OTP requests. Please try again in 15 minutes.');
    }

    // Increment phone-based rate limit
    const newCount = phoneCount ? parseInt(phoneCount, 10) + 1 : 1;
    await this.redisService.set(phoneRateLimitKey, newCount.toString(), 900); // 15 minutes

    return this.authService.sendOtp(sendOtpDto, ipAddress);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get access tokens' })
  @ApiBody({ type: VerifyOtpDto })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Ip() ipAddress: string,
    @Headers('x-device-id') deviceId?: string,
  ) {
    // Additional rate limiting by phone number (more restrictive than IP-based)
    const phoneRateLimitKey = `rate_limit:verify_otp:${verifyOtpDto.phone}`;
    const phoneCount = await this.redisService.get(phoneRateLimitKey);
    
    if (phoneCount && parseInt(phoneCount, 10) >= 5) {
      throw new BadRequestException('Too many verification attempts. Please try again in 15 minutes.');
    }

    // Increment phone-based rate limit
    const newCount = phoneCount ? parseInt(phoneCount, 10) + 1 : 1;
    await this.redisService.set(phoneRateLimitKey, newCount.toString(), 900); // 15 minutes

    return this.authService.verifyOtp(verifyOtpDto, ipAddress, deviceId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(
    @CurrentUser() user: any,
    @Body() refreshTokenDto?: RefreshTokenDto,
  ) {
    return this.authService.logout(user.userId, refreshTokenDto?.refreshToken);
  }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.userId);
  }
}
