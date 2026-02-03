import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderStatusHistoryService } from './services/order-status-history.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { AddressesHelperService } from './services/addresses-helper.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VendorsModule } from '../vendors/vendors.module';
import { ServiceProvidersModule } from '../service-providers/service-providers.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    VendorsModule,
    ServiceProvidersModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderStatusHistoryService,
    OrderStateMachineService,
    AddressesHelperService,
  ],
  exports: [OrdersService, OrderStatusHistoryService],
})
export class OrdersModule {}

