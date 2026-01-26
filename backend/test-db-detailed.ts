import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as net from 'net';

dotenv.config({ path: '.env' });

async function testDatabaseConnection() {
  console.log('=== Detailed Database Connection Test ===\n');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    return;
  }

  // Parse connection string (hide password)
  const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (urlMatch) {
    const [, user, password, host, port, database] = urlMatch;
    console.log('Connection Details:');
    console.log('  Host:', host);
    console.log('  Port:', port);
    console.log('  Database:', database);
    console.log('  User:', user);
    console.log('  Password:', '***' + password.slice(-3));
    console.log('');
  }

  // Test 1: Basic TCP connection
  console.log('1. Testing TCP connection to database server...');
  const urlMatch2 = dbUrl.match(/@([^:]+):(\d+)/);
  if (urlMatch2) {
    const [, host, port] = urlMatch2;
    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = 5000;
      
      socket.setTimeout(timeout);
      socket.once('connect', () => {
        console.log('✅ TCP connection successful!');
        socket.destroy();
        resolve();
      });
      socket.once('timeout', () => {
        console.log('❌ TCP connection timeout');
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
      socket.once('error', (err: any) => {
        console.log('❌ TCP connection failed:', err.message);
        console.log('   This might indicate:');
        console.log('   - Firewall blocking the connection');
        console.log('   - Network connectivity issues');
        console.log('   - Supabase project not active');
        reject(err);
      });
      
      socket.connect(parseInt(port), host);
    }).catch(() => {
      // Error already logged
    });
  }

  console.log('\n2. Testing Prisma connection...');
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('   Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Prisma connection successful!');
    
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Database query successful!');
    console.log('   Version:', (result as any)[0]?.version);
    
  } catch (error: any) {
    console.error('❌ Prisma connection failed!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n   Troubleshooting suggestions:');
      console.log('   1. Check if your Supabase project is active in the dashboard');
      console.log('   2. Verify the connection string in Supabase Dashboard → Settings → Database');
      console.log('   3. Check if your firewall/antivirus is blocking port 5432');
      console.log('   4. Try using the "Connection Pooling" connection string instead');
      console.log('   5. Verify your IP is allowed (though you said it allows all)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });



