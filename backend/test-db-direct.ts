import * as dotenv from 'dotenv';
import * as dns from 'dns';
import * as net from 'net';

dotenv.config({ path: '.env' });

async function testConnection() {
  console.log('=== Direct Connection Test ===\n');
  
  const hostname = 'db.wvnjopzodbxfyfjwtyrf.supabase.co';
  const port = 5432;
  
  // Test DNS resolution
  console.log('1. Testing DNS resolution...');
  try {
    const addresses = await new Promise<string[]>((resolve, reject) => {
      dns.resolve4(hostname, (err, addresses) => {
        if (err) {
          dns.resolve6(hostname, (err6, addresses6) => {
            if (err6) reject(err6);
            else resolve(addresses6);
          });
        } else {
          resolve(addresses);
        }
      });
    });
    console.log('✅ DNS resolved:', addresses);
  } catch (error: any) {
    console.log('❌ DNS resolution failed:', error.message);
  }
  
  // Test TCP connection
  console.log('\n2. Testing TCP connection...');
  return new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    let connected = false;
    
    socket.setTimeout(10000);
    
    socket.once('connect', () => {
      connected = true;
      console.log('✅ TCP connection successful!');
      socket.destroy();
      resolve();
    });
    
    socket.once('timeout', () => {
      console.log('❌ Connection timeout');
      socket.destroy();
      reject(new Error('Timeout'));
    });
    
    socket.once('error', (err: any) => {
      if (!connected) {
        console.log('❌ Connection failed:', err.message);
        console.log('   Code:', err.code);
        if (err.code === 'ENOTFOUND') {
          console.log('\n   This suggests a DNS resolution issue.');
          console.log('   Try:');
          console.log('   1. Check your internet connection');
          console.log('   2. Try using a VPN if you\'re behind a corporate firewall');
          console.log('   3. Check Windows Firewall settings');
          console.log('   4. Try from a different network');
        }
      }
      reject(err);
    });
    
    console.log(`   Connecting to ${hostname}:${port}...`);
    socket.connect(port, hostname);
  });
}

testConnection()
  .then(() => {
    console.log('\n✅ Connection test complete');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });



