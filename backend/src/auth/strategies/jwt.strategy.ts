import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../services/token.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private tokenService: TokenService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      const tokenVersion = await this.tokenService.getTokenVersion(payload.sub);
      if (payload.tokenVersion !== tokenVersion) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      let role = payload.role;
      if (role == null) {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: { role: true },
        });
        role = dbUser?.role ?? 'CUSTOMER';
      }

      return {
        userId: payload.sub,
        phone: payload.phone,
        tokenVersion: payload.tokenVersion,
        deviceId: payload.deviceId,
        role,
      };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

