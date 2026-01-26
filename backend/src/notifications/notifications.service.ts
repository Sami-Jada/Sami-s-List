import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    // TODO: Notification model not in Prisma schema yet
    throw new Error('Notifications not implemented - model missing from schema');
  }

  async findAll(userId?: string) {
    // TODO: Notification model not in Prisma schema yet
    throw new Error('Notifications not implemented - model missing from schema');
  }

  async findOne(id: string) {
    // TODO: Notification model not in Prisma schema yet
    throw new Error('Notifications not implemented - model missing from schema');
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    // TODO: Notification model not in Prisma schema yet
    throw new Error('Notifications not implemented - model missing from schema');
  }

  async markAsRead(id: string) {
    // TODO: Notification model not in Prisma schema yet
    throw new Error('Notifications not implemented - model missing from schema');
  }

  async remove(id: string) {
    // TODO: Notification model not in Prisma schema yet
    throw new Error('Notifications not implemented - model missing from schema');
  }
}
