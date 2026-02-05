/**
 * One-time script: set admin user password to a known value.
 * Uses DATABASE_URL from .env. Run from backend: npx ts-node scripts/reset-admin-password.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const NEW_PASSWORD = 'admin123!';

async function main() {
  const prisma = new PrismaClient();
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });
  if (!admin) {
    console.error('No admin user found in database.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);
  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: hash },
  });
  console.log(`Admin password updated for user: ${admin.username ?? admin.id}. You can now log in with password: ${NEW_PASSWORD}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
