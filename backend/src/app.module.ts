import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { TerminusModule } from '@nestjs/terminus';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';
import { DriversModule } from './drivers/drivers.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoggerModule } from './logger/logger.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Winston Logger
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'samis-list-api' },
      transports: ((): winston.transport[] => {
        const transports: winston.transport[] = [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                ({ timestamp, level, message, context, ...meta }) => {
                  return `${timestamp} [${context}] ${level}: ${message} ${
                    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                  }`;
                },
              ),
            ),
          }),
        ];

        const shouldLogToFile =
          process.env.LOG_TO_FILE === 'true' || process.env.NODE_ENV !== 'production';

        if (shouldLogToFile) {
          transports.push(
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
            }),
          );
        }

        return transports;
      })(),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),

    // Health Check
    TerminusModule,

    // Event Emitter
    EventEmitterModule.forRoot(),

    // Database & Cache
    PrismaModule,
    RedisModule,

    // Application Modules
    AuthModule,
    UsersModule,
    VendorsModule,
    DriversModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    LoggerModule,
    ServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

