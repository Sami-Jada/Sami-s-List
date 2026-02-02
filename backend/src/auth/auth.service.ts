import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

export interface CheckPhoneResult {
  exists: boolean;
  accountType?: 'user' | 'driver';
  hasPassword: boolean;
}

export interface AuthUserPayload {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private otpService: OtpService,
    private tokenService: TokenService,
  ) {}

  /**
   * Check if phone exists in users or drivers (for login branching).
   * Only send OTP for new phones; existing accounts use password.
   */
  async checkPhone(phone: string): Promise<CheckPhoneResult> {
    const userWithAuth = await this.usersService.findByPhoneWithAuthInfo(phone);
    if (userWithAuth) {
      return {
        exists: true,
        accountType: 'user',
        hasPassword: userWithAuth.hasPassword,
      };
    }
    const driver = await this.prisma.driver.findUnique({
      where: { phone },
      select: { id: true, passwordHash: true },
    } as { where: { phone: string }; select: { id: true; passwordHash: true } });
    if (driver) {
      const d = driver as { passwordHash?: string | null };
      return {
        exists: true,
        accountType: 'driver',
        hasPassword: !!d.passwordHash,
      };
    }
    return { exists: false, hasPassword: false };
  }

  /**
   * Password login for existing user or driver.
   */
  async loginWithPassword(
    phone: string,
    password: string,
    deviceId?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: AuthUserPayload;
  }> {
    const userWithPassword = await this.usersService.findByPhoneWithPassword(phone);
    const userPwdHash = userWithPassword && (userWithPassword as { passwordHash?: string | null }).passwordHash;
    if (userPwdHash) {
      const valid = await bcrypt.compare(password, userPwdHash);
      if (!valid) {
        this.logger.warn(`Invalid password attempt for user ${phone}`);
        throw new UnauthorizedException('Invalid phone or password');
      }
      const user = userWithPassword!;
      const { accessToken, refreshToken } = await this.tokenService.generateTokens(
        user.id,
        user.phone,
        deviceId,
      );
      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email ?? undefined,
          role: (user as { role?: string }).role ?? 'CUSTOMER',
        },
      };
    }
    const driver = await this.prisma.driver.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, passwordHash: true },
    } as { where: { phone: string }; select: { id: true; name: true; phone: true; passwordHash: true } });
    const driverPwdHash = driver && (driver as { passwordHash?: string | null }).passwordHash;
    if (driverPwdHash) {
      const valid = await bcrypt.compare(password, driverPwdHash);
      if (!valid) {
        this.logger.warn(`Invalid password attempt for driver ${phone}`);
        throw new UnauthorizedException('Invalid phone or password');
      }
      const linkedUser = await this.usersService.findByPhone(phone);
      if (!linkedUser) {
        this.logger.error(`Driver ${(driver as { id: string }).id} has no linked User for phone ${phone}`);
        throw new UnauthorizedException('Account configuration error');
      }
      const { accessToken, refreshToken } = await this.tokenService.generateTokens(
        linkedUser.id,
        linkedUser.phone,
        deviceId,
      );
      return {
        accessToken,
        refreshToken,
        user: {
          id: linkedUser.id,
          phone: linkedUser.phone,
          name: linkedUser.name,
          email: linkedUser.email ?? undefined,
          role: 'DRIVER',
        },
      };
    }
    throw new UnauthorizedException('Invalid phone or password');
  }

  /**
   * Send OTP only when phone is not in users or drivers (new registration).
   */
  async sendOtp(sendOtpDto: SendOtpDto, ipAddress: string): Promise<{ message: string }> {
    const { phone } = sendOtpDto;

    try {
      const check = await this.checkPhone(phone);
      if (check.exists && check.hasPassword) {
        throw new BadRequestException('Account exists; sign in with password');
      }

      await this.otpService.generateAndStoreOtp(phone);
      this.logger.log(`OTP sent to ${phone} from IP: ${ipAddress}`);
      return { message: 'OTP has been sent to your phone number' };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to send OTP to ${phone}: ${error?.message || 'Unknown error'}`, error?.stack);
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify OTP and return tokens. Creates user if not found (new registration).
   */
  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
    ipAddress: string,
    deviceId?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: AuthUserPayload;
    isGuest?: boolean;
    isNewUser?: boolean;
  }> {
    const { phone, otp } = verifyOtpDto;

    try {
      const isValid = await this.otpService.verifyOtp(phone, otp);
      if (!isValid) {
        this.logger.warn(`Failed OTP verification attempt for ${phone} from IP: ${ipAddress}`);
        throw new UnauthorizedException('Invalid or expired OTP code');
      }

      let userInfo = await this.usersService.findByPhoneWithAuthInfo(phone);
      let isNewUser = false;
      if (!userInfo) {
        await this.usersService.create({ phone, name: '' });
        userInfo = await this.usersService.findByPhoneWithAuthInfo(phone);
        if (!userInfo) throw new UnauthorizedException('User creation failed');
        isNewUser = true;
        this.logger.log(`New user created: ${userInfo.id} (${phone})`);
      } else {
        isNewUser = (userInfo.name === '' || !userInfo.name) && !userInfo.hasPassword;
      }
      const { hasPassword: _, ...user } = userInfo;

      const isGuestUser = user.name === '' || !user.name;
      if (isGuestUser) {
        this.logger.log(`Guest user ${user.id} (${phone}) is signing up - will merge orders if any exist`);
      }

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
          email: user.email ?? undefined,
          role: (user as { role?: string }).role ?? 'CUSTOMER',
        },
        isGuest: isGuestUser,
        isNewUser,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
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
   * Set password for current user (customers only, after OTP onboarding).
   */
  async setPassword(userId: string, password: string) {
    await this.usersService.setPassword(userId, password);
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
