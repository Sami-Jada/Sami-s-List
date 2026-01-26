import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private otpService: OtpService,
    private tokenService: TokenService,
  ) {}

  /**
   * Send OTP to phone number
   * Creates user if doesn't exist (registration flow)
   */
  async sendOtp(sendOtpDto: SendOtpDto, ipAddress: string): Promise<{ message: string }> {
    const { phone } = sendOtpDto;

    try {
      // Check if user exists, create if not (registration)
      let user = await this.usersService.findByPhone(phone);
      
      if (!user) {
        // Create new user with phone number
        const newUser = await this.usersService.create({
          phone,
          name: '', // Name can be updated later
        });
        user = await this.usersService.findById(newUser.id);
        this.logger.log(`New user created: ${user.id} (${phone})`);
      }

      // Generate and store OTP
      await this.otpService.generateAndStoreOtp(phone);

      this.logger.log(`OTP sent to ${phone} from IP: ${ipAddress}`);
      
      // Return generic message (don't reveal if user exists)
      return {
        message: 'OTP has been sent to your phone number',
      };
    } catch (error: any) {
      this.logger.error(`Failed to send OTP to ${phone}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify OTP and return tokens
   */
  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
    ipAddress: string,
    deviceId?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      phone: string;
      name: string;
      email?: string;
    };
    isGuest?: boolean;
  }> {
    const { phone, otp } = verifyOtpDto;

    try {
      // Verify OTP
      const isValid = await this.otpService.verifyOtp(phone, otp);

      if (!isValid) {
        this.logger.warn(`Failed OTP verification attempt for ${phone} from IP: ${ipAddress}`);
        throw new UnauthorizedException('Invalid or expired OTP code');
      }

      // Get or create user // To trigger a new deployment in railway
      let user = await this.usersService.findByPhone(phone);
      
      if (!user) {
        // This shouldn't happen if sendOtp was called first, but handle it
        const newUser = await this.usersService.create({
          phone,
          name: '',
        });
        user = await this.usersService.findById(newUser.id);
      }

      // Check if this is a guest user (empty name) with existing orders
      // If so, this is a conversion from guest to registered user
      const isGuestUser = user.name === '';
      
      if (isGuestUser) {
        this.logger.log(`Guest user ${user.id} (${phone}) is signing up - will merge orders if any exist`);
        // Note: Orders will be merged when user updates their name/profile
        // For now, user remains as guest until they update their profile
      }

      // Generate tokens
      const { accessToken, refreshToken } =
        await this.tokenService.generateTokens(user.id, user.phone, deviceId);

      this.logger.log(`Successful OTP verification for user ${user.id} (${phone}) from IP: ${ipAddress}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email || undefined,
        },
        isGuest: isGuestUser, // Indicate if this is a guest user
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`OTP verification error for ${phone}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw new UnauthorizedException('Invalid or expired OTP code');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      return await this.tokenService.refreshTokens(refreshToken);
    } catch (error: any) {
      this.logger.warn(`Token refresh failed: ${error?.message || 'Unknown error'}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(userId: string, refreshToken?: string): Promise<{ message: string }> {
    try {
      await this.tokenService.revokeRefreshToken(userId, refreshToken);
      this.logger.log(`User ${userId} logged out`);
      return { message: 'Logged out successfully' };
    } catch (error: any) {
      this.logger.error(`Logout error for user ${userId}: ${error?.message || 'Unknown error'}`);
      throw new BadRequestException('Failed to logout');
    }
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
