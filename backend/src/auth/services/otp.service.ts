import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_SECONDS =
    parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10); // Default 5 minutes
  private readonly OTP_COOLDOWN_SECONDS =
    parseInt(process.env.OTP_COOLDOWN_SECONDS || '60', 10); // Default 60 seconds between sends
  private readonly OTP_DAILY_LIMIT =
    parseInt(process.env.OTP_DAILY_LIMIT || '10', 10); // Default 10 OTPs per day per phone

  constructor(
    private redisService: RedisService,
    private smsService: SmsService,
  ) {}

  /**
   * Generate a random 6-digit OTP code
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check if an OTP was sent recently (cooldown period)
   * @param phone - Phone number
   * @returns Remaining cooldown seconds, or 0 if no cooldown
   */
  private async getCooldownRemaining(phone: string): Promise<number> {
    const cooldownKey = `otp_cooldown:${phone}`;
    const ttl = await this.redisService.ttl(cooldownKey);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Check daily OTP limit for a phone number
   * @param phone - Phone number
   * @returns true if under limit, false if limit exceeded
   */
  private async checkDailyLimit(phone: string): Promise<boolean> {
    const dailyKey = `otp_daily:${phone}:${new Date().toISOString().split('T')[0]}`;
    const count = await this.redisService.get(dailyKey);
    const currentCount = count ? parseInt(count, 10) : 0;
    return currentCount < this.OTP_DAILY_LIMIT;
  }

  /**
   * Increment daily OTP counter for a phone number
   * @param phone - Phone number
   */
  private async incrementDailyCounter(phone: string): Promise<void> {
    const dailyKey = `otp_daily:${phone}:${new Date().toISOString().split('T')[0]}`;
    const newCount = await this.redisService.incr(dailyKey);
    const secondsUntilMidnight = this.getSecondsUntilMidnight();
    
    // If this is a new key (count is 1), set the TTL
    // Otherwise, the TTL should already be set, but we update it to be safe
    await this.redisService.expire(dailyKey, secondsUntilMidnight);
  }

  /**
   * Get seconds until midnight (for daily limit TTL)
   */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  /**
   * Generate and store OTP for a phone number
   * @param phone - Phone number
   * @returns The generated OTP code (for logging/testing purposes)
   * @throws BadRequestException if rate limit exceeded
   */
  async generateAndStoreOtp(phone: string): Promise<string> {
    // Check cooldown period (minimum time between OTP sends)
    const cooldownRemaining = await this.getCooldownRemaining(phone);
    if (cooldownRemaining > 0) {
      const minutes = Math.ceil(cooldownRemaining / 60);
      throw new BadRequestException(
        `Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before requesting another OTP code.`,
      );
    }

    // Check daily limit
    const underDailyLimit = await this.checkDailyLimit(phone);
    if (!underDailyLimit) {
      throw new BadRequestException(
        `Daily OTP limit of ${this.OTP_DAILY_LIMIT} requests exceeded. Please try again tomorrow.`,
      );
    }

    const otp = this.generateOtp();
    
    // Hash the OTP before storing (security best practice)
    // Using 8 rounds instead of 10 for OTP since it's short-lived (5 min expiry)
    // This reduces CPU time by ~50-100ms per verify operation while still being secure
    const hashedOtp = await bcrypt.hash(otp, 8);
    
    // Store in Redis with phone as key
    const key = `otp:${phone}`;
    await this.redisService.set(key, hashedOtp, this.OTP_EXPIRY_SECONDS);

    // Set cooldown period to prevent rapid-fire requests
    const cooldownKey = `otp_cooldown:${phone}`;
    await this.redisService.set(cooldownKey, '1', this.OTP_COOLDOWN_SECONDS);

    // Increment daily counter
    await this.incrementDailyCounter(phone);

    // Send OTP via SMS (best-effort)
    const smsSent = await this.smsService.sendOtpSms(phone, otp);
    if (!smsSent) {
      this.logger.warn(
        `OTP generated for ${phone} but SMS delivery failed. OTP is still valid for verification.`,
      );
    } else {
      this.logger.log(
        `OTP generated and SMS sent to ${phone} (expires in ${this.OTP_EXPIRY_SECONDS}s, cooldown: ${this.OTP_COOLDOWN_SECONDS}s)`,
      );
    }

    return otp;
  }

  /**
   * Verify OTP for a phone number
   * @param phone - Phone number
   * @param otp - OTP code to verify
   * @returns true if OTP is valid, false otherwise
   */
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const key = `otp:${phone}`;
    const storedHashedOtp = await this.redisService.get(key);
    
    if (!storedHashedOtp) {
      return false; // OTP expired or doesn't exist
    }
    
    // Verify the OTP against the hashed version
    const isValid = await bcrypt.compare(otp, storedHashedOtp);
    
    if (isValid) {
      // Delete OTP after successful verification (one-time use)
      await this.redisService.del(key);
    }
    
    return isValid;
  }

  /**
   * Check if OTP exists for a phone number (for rate limiting)
   */
  async otpExists(phone: string): Promise<boolean> {
    const key = `otp:${phone}`;
    return this.redisService.exists(key);
  }

  /**
   * Delete OTP for a phone number (manual cleanup)
   */
  async deleteOtp(phone: string): Promise<void> {
    const key = `otp:${phone}`;
    await this.redisService.del(key);
  }

  /**
   * Get remaining TTL for OTP
   */
  async getOtpTtl(phone: string): Promise<number> {
    const key = `otp:${phone}`;
    const client = this.redisService.getClient();
    return client.ttl(key);
  }
}





