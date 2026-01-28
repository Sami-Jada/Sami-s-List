import { Injectable, Logger } from '@nestjs/common';
import { URLSearchParams } from 'url';

// Use global fetch provided by Node 18+/20+ at runtime.
// We declare the type as any to avoid needing DOM lib types in TypeScript.
declare const fetch: any;

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly apiKey = process.env.VONAGE_API_KEY;
  private readonly apiSecret = process.env.VONAGE_API_SECRET;
  private readonly from = process.env.VONAGE_FROM;

  private get isConfigured(): boolean {
    return !!this.apiKey && !!this.apiSecret && !!this.from;
  }

  /**
   * Send an OTP code via SMS using Vonage.
   * This is a best-effort operation: on failure we log the error but do not
   * expose the OTP code to logs in production.
   */
  async sendOtpSms(to: string, code: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(
        'Vonage SMS is not configured (missing VONAGE_API_KEY / VONAGE_API_SECRET / VONAGE_FROM). Skipping SMS send.',
      );
      return;
    }

    const text = `Your Sami's List code is ${code}`;

    const body = new URLSearchParams({
      api_key: this.apiKey as string,
      api_secret: this.apiSecret as string,
      to,
      from: this.from as string,
      text,
    }).toString();

    try {
      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        this.logger.error(
          `Vonage SMS API HTTP error: ${response.status} ${response.statusText}`,
        );
        this.logger.debug(`Vonage response body: ${JSON.stringify(data)}`);
        return;
      }

      if (!data || !Array.isArray(data.messages) || data.messages.length === 0) {
        this.logger.error('Vonage SMS API returned an unexpected response format');
        this.logger.debug(`Raw response: ${JSON.stringify(data)}`);
        return;
      }

      const msg = data.messages[0];
      if (msg.status !== '0') {
        this.logger.error(
          `Vonage SMS send failed for ${to}: status=${msg.status}, error-text=${msg['error-text']}`,
        );
        return;
      }

      this.logger.log(`OTP SMS sent successfully to ${to}`);
    } catch (error: any) {
      this.logger.error(
        `Error sending OTP SMS via Vonage to ${to}: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
    }
  }
}

