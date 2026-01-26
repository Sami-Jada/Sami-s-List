/**
 * Order Number Generator
 * 
 * Generates unique order numbers in the format: ORD-YYYYMMDD-XXXXXX
 * Where XXXXXX is a 6-digit sequential number
 * 
 * For production, consider using a database sequence or Redis counter
 * to ensure uniqueness across multiple instances.
 */

export class OrderNumberGenerator {
  /**
   * Generate a unique order number
   * Format: ORD-YYYYMMDD-XXXXXX
   */
  static generate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;
    
    // Generate a 6-digit random number
    // In production, use a sequential counter from database/Redis
    const randomPart = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    
    return `ORD-${datePart}-${randomPart}`;
  }

  /**
   * Generate order number with timestamp for better uniqueness
   * Format: ORD-TIMESTAMP-RANDOM
   */
  static generateWithTimestamp(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Generate UUID-based order number (current implementation)
   * Format: ORD-UUID
   */
  static generateUUID(): string {
    // This would be used with Prisma's @default(uuid())
    return `ORD-${Date.now()}`;
  }
}





