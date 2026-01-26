import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function testConnections() {
  console.log('=== Testing Database and Redis Connections ===\n');

  // Test PostgreSQL/Supabase Connection
  console.log('1. Testing PostgreSQL (Supabase) connection...');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connection successful!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Database query successful!');
    console.log('   Database version:', (result as any)[0]?.version || 'Unknown');
    
    // Check if PostGIS is enabled
    try {
      const postgisCheck = await prisma.$queryRaw`SELECT PostGIS_version() as version`;
      console.log('✅ PostGIS extension is enabled!');
      console.log('   PostGIS version:', (postgisCheck as any)[0]?.version || 'Unknown');
    } catch (error) {
      console.log('⚠️  PostGIS extension not found (will be enabled in migration)');
    }
    
  } catch (error: any) {
    console.error('❌ PostgreSQL connection failed!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    if (error.meta) {
      console.error('   Meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n');

  // Test Redis/Upstash Connection
  console.log('2. Testing Redis (Upstash) connection...');
  let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log('   Connection URL:', redisUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
  
  // Try SSL first (rediss://) if it's not already SSL
  if (redisUrl.startsWith('redis://') && redisUrl.includes('upstash.io')) {
    console.log('   Trying with SSL (rediss://)...');
    redisUrl = redisUrl.replace('redis://', 'rediss://');
  }
  
  const redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 50, 2000);
    },
    connectTimeout: 10000, // 10 second timeout
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
  });

  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      console.log('✅ Redis connection successful!');
      
      // Test set/get
      await redis.set('test:connection', 'success', 'EX', 10);
      const value = await redis.get('test:connection');
      if (value === 'success') {
        console.log('✅ Redis read/write test successful!');
      }
      await redis.del('test:connection');
    } else {
      console.error('❌ Redis ping returned unexpected value:', pong);
    }
  } catch (error: any) {
    console.error('❌ Redis connection failed!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
  } finally {
    redis.disconnect();
  }

  console.log('\n=== Connection Test Complete ===');
}

// Run the tests
testConnections()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });

