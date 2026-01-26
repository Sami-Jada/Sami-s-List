import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Force IPv4 preference
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: '.env' });

async function testWithIPv4() {
  console.log('=== Testing with IPv4 preference ===\n');
  
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    console.log('Attempting connection with IPv4 preference...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Query successful!');
    console.log('Database version:', (result as any)[0]?.version);
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nIf this still fails, try:');
    console.log('1. Use Connection Pooling URL from Supabase (Session mode)');
    console.log('2. Check Windows Firewall');
    console.log('3. Try from a different network');
  } finally {
    await prisma.$disconnect();
  }
}

testWithIPv4()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));



