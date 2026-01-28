import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

interface TokenPayload {
  sub: string; // userId
  phone: string;
  tokenVersion: number;
  deviceId?: string;
}

interface RefreshTokenData {
  userId: string;
  phone: string;
  tokenVersion: number;
  deviceId?: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private prisma: PrismaService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || '';
    this.jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || '';
    this.accessTokenExpiry =
      this.configService.get<string>('JWT_EXPIRATION') || '15m';
    this.refreshTokenExpiry =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
  }

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(
    userId: string,
    phone: string,
    deviceId?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Get or create token version for user
    const tokenVersion = await this.getTokenVersion(userId);

    const payload: TokenPayload = {
      sub: userId,
      phone,
      tokenVersion,
      ...(deviceId && { deviceId }),
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.refreshTokenExpiry,
    });

    // Store refresh token in Redis for session management
    await this.storeRefreshToken(userId, refreshToken, deviceId);

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.jwtSecret,
      });

      // Verify token version hasn't been invalidated
      const currentVersion = await this.getTokenVersion(payload.sub);
      if (payload.tokenVersion !== currentVersion) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      return payload;
    } catch (error: any) {
      this.logger.warn(`Access token verification failed: ${error?.message || 'Unknown error'}`);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Verify and decode refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenData> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.jwtRefreshSecret,
      });

      // Check if refresh token exists in Redis (not revoked)
      const isTokenValid = await this.isRefreshTokenValid(
        payload.sub,
        token,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Verify token version
      const currentVersion = await this.getTokenVersion(payload.sub);
      if (payload.tokenVersion !== currentVersion) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      return {
        userId: payload.sub,
        phone: payload.phone,
        tokenVersion: payload.tokenVersion,
        deviceId: payload.deviceId,
      };
    } catch (error: any) {
      this.logger.warn(`Refresh token verification failed: ${error?.message || 'Unknown error'}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Refresh access token using refresh token (with rotation)
   */
  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenData = await this.verifyRefreshToken(refreshToken);

    // Revoke old refresh token (token rotation)
    await this.revokeRefreshToken(tokenData.userId, refreshToken);

    // Generate new tokens
    return this.generateTokens(
      tokenData.userId,
      tokenData.phone,
      tokenData.deviceId,
    );
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Revoke specific token
      const key = `refresh_token:${userId}:${refreshToken}`;
      await this.redisService.del(key);
    } else {
      // Revoke all tokens for user (security event)
      await this.invalidateAllUserTokens(userId);
    }
  }

  /**
   * Invalidate all tokens for a user (increment token version)
   */
  async invalidateAllUserTokens(userId: string): Promise<void> {
    const key = `token_version:${userId}`;
    const currentVersion = await this.getTokenVersion(userId);
    await this.redisService.set(key, (currentVersion + 1).toString());
    
    // Delete all refresh tokens for this user
    const pattern = `refresh_token:${userId}:*`;
    const client = this.redisService.getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((k) => this.redisService.del(k)));
    }
  }

  /**
   * Get current token version for user
   */
  async getTokenVersion(userId: string): Promise<number> {
    const key = `token_version:${userId}`;
    const version = await this.redisService.get(key);
    return version ? parseInt(version, 10) : 1;
  }

  /**
   * Store refresh token in Redis
   */
  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    deviceId?: string,
  ): Promise<void> {
    const key = `refresh_token:${userId}:${refreshToken}`;
    const data = {
      userId,
      deviceId,
      createdAt: new Date().toISOString(),
    };
    
    // Store for 7 days (refresh token expiry)
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redisService.set(key, JSON.stringify(data), ttl);
  }

  /**
   * Check if refresh token is valid (exists in Redis)
   */
  private async isRefreshTokenValid(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const key = `refresh_token:${userId}:${refreshToken}`;
    return this.redisService.exists(key);
  }

}

