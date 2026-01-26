import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user from database to check role
    // Note: Currently User model doesn't have role field
    // This is a placeholder for when roles are added
    // For now, you can add role to JWT payload in TokenService.generateTokens()
    // and access via user.role from request
    
    // TODO: Implement role checking when roles are added to User model or JWT payload
    // Example implementation:
    // const dbUser = await this.prisma.user.findUnique({
    //   where: { id: user.userId },
    //   select: { role: true },
    // });
    // 
    // if (!dbUser || !dbUser.role || !requiredRoles.includes(dbUser.role)) {
    //   throw new ForbiddenException('Insufficient permissions');
    // }

    // Temporary: Allow access if no role check (will be implemented when roles are added)
    // Uncomment above code when roles are implemented in User model or JWT payload

    return true; // Temporary: allow access until roles are implemented
  }
}
