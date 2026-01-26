import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env' });

async function applyMigration() {
  console.log('=== Applying Migration Directly ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '0_init', 'migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('1. Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected!\n');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`2. Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   [${i + 1}/${statements.length}] Executing statement...`);
          await prisma.$executeRawUnsafe(statement);
          console.log(`   ✅ Statement ${i + 1} completed`);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('\n✅ Migration applied successfully!');
    
    // Mark migration as applied
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id" VARCHAR(36) PRIMARY KEY,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMP,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMP,
          "started_at" TIMESTAMP NOT NULL DEFAULT now(),
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
      `);
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, applied_steps_count)
        VALUES ('0_init', '', '0_init', now(), 1)
        ON CONFLICT (id) DO NOTHING;
      `);
      
      console.log('✅ Migration record created');
    } catch (error: any) {
      console.log('⚠️  Could not create migration record (may already exist)');
    }
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });



