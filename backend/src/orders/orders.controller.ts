import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateGuestOrderDto } from './dto/create-guest-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post('guest')
  @ApiOperation({ summary: 'Create a guest order (no authentication required)' })
  @ApiResponse({ status: 201, description: 'Guest order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or no vendor found' })
  async createGuestOrder(@Body() createGuestOrderDto: CreateGuestOrderDto) {
    return this.ordersService.createGuestOrder(createGuestOrderDto);
  }

  @Roles('USER')
  @Post()
  @ApiOperation({ summary: 'Create a new order (user only)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or no vendor found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - user only' })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.create(user.userId, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with optional filters' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() filters: OrderFilterDto,
    @CurrentUser() user: any,
  ) {
    // TODO: Get user role from JWT payload when roles are implemented
    return this.ordersService.findAll(filters, user.userId, 'USER');
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders (convenience endpoint)' })
  @ApiResponse({ status: 200, description: 'List of user orders' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.findByUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // TODO: Get user role from JWT payload when roles are implemented
    return this.ordersService.findById(id, user.userId, 'USER');
  }

  @Roles('VENDOR', 'DRIVER', 'ADMIN')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (vendor/driver/admin)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(
      id,
      updateStatusDto,
      user.userId || 'system',
    );
  }

  @Roles('VENDOR', 'ADMIN')
  @Put(':id/assign-driver')
  @ApiOperation({ summary: 'Assign driver to order (vendor/admin)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Driver assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order status or driver not available' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order or driver not found' })
  async assignDriver(
    @Param('id') id: string,
    @Body() assignDriverDto: AssignDriverDto,
  ) {
    return this.ordersService.assignDriver(id, assignDriverDto);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (user/vendor/driver)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelDto: CancelOrderDto,
    @CurrentUser() user: any,
  ) {
    // TODO: Determine cancelledBy from user role when roles are implemented
    // For now, default to 'user'
    return this.ordersService.cancelOrder(id, cancelDto);
  }

  @Roles('DRIVER', 'ADMIN')
  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete order after delivery (driver/admin)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order completed successfully' })
  @ApiResponse({ status: 400, description: 'Order must be in DELIVERED status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async completeOrder(@Param('id') id: string) {
    return this.ordersService.completeOrder(id);
  }
}
