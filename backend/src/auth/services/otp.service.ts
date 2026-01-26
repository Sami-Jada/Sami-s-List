import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_SECONDS =
    parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10); // Default 5 minutes

  constructor(private redisService: RedisService) {}

  /**
   * Generate a random 6-digit OTP code
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate and store OTP for a phone number
   * @param phone - Phone number
   * @returns The generated OTP code (for logging/testing purposes)
   */
  async generateAndStoreOtp(phone: string): Promise<string> {
    const otp = this.generateOtp();
    
    // Hash the OTP before storing (security best practice)
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Store in Redis with phone as key
    const key = `otp:${phone}`;
    await this.redisService.set(key, hashedOtp, this.OTP_EXPIRY_SECONDS);
    
    // TODO: Integrate with Twilio or SMS provider to send OTP via SMS
    // For now, log to console for development/testing
    this.logger.log(`OTP for ${phone}: ${otp} (expires in ${this.OTP_EXPIRY_SECONDS}s)`);
    this.logger.warn('SMS integration not implemented. OTP logged to console.');
    
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





