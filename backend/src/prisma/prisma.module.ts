import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaGeoService } from './prisma-geo.service';

@Global()
@Module({
  providers: [PrismaService, PrismaGeoService],
  exports: [PrismaService, PrismaGeoService],
})
export class PrismaModule {}

