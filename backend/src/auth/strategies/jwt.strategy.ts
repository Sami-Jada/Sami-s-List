import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      // Verify token version is still valid
      const tokenVersion = await this.tokenService.getTokenVersion(payload.sub);
      if (payload.tokenVersion !== tokenVersion) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      return {
        userId: payload.sub,
        phone: payload.phone,
        tokenVersion: payload.tokenVersion,
        deviceId: payload.deviceId,
      };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

