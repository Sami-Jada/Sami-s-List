import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

// Adding comment cause cursor is a fucking retarded whore
// SEcond comment because railway is a fucking useless bitch
// Admin user is only created when SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD are set in .env
const SEED_ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME;
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - comment out in production)
  console.log('🧹 Cleaning existing data...');
  await prisma.rating.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.serviceProvider.deleteMany();
  await prisma.vendorService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  // Create 1 Vendor
  console.log('📦 Creating vendor...');
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Al-Ahli Gas Company',
      phone: '+962791234567', // Note: Encrypt in production
      businessLicense: 'BL-2024-001',
      address: 'King Hussein Street, Amman',
      latitude: 31.9539, // Amman coordinates
      longitude: 35.9106,
      unitPrice: 8.5,
      serviceFee: 2.0,
      isActive: true,
      rating: 4.5,
      totalOrders: 0,
    },
  });
  console.log(`✅ Created vendor: ${vendor.name}`);

  // Create service categories (for Categories screen)
  console.log('📂 Creating service categories...');
  const serviceGas = await prisma.service.create({
    data: {
      name: 'Gas Canister Refill',
      slug: 'gas-canister-refill',
      iconName: 'gas-canister',
      isPopular: true,
      sortOrder: 0,
    },
  });
  const servicePlumber = await prisma.service.create({
    data: {
      name: 'Plumbers',
      slug: 'plumbers',
      iconName: 'plumber',
      isPopular: true,
      sortOrder: 1,
    },
  });
  const serviceElectrician = await prisma.service.create({
    data: {
      name: 'Electricians',
      slug: 'electricians',
      iconName: 'electrician',
      isPopular: false,
      sortOrder: 2,
    },
  });
  const serviceWater = await prisma.service.create({
    data: {
      name: 'Water Tank Refills',
      slug: 'water-tank-refills',
      iconName: 'water-tank',
      isPopular: false,
      sortOrder: 3,
    },
  });
  const serviceGardener = await prisma.service.create({
    data: {
      name: 'Gardeners',
      slug: 'gardeners',
      iconName: 'gardener',
      isPopular: false,
      sortOrder: 4,
    },
  });
  console.log(`✅ Created services: Gas, Plumbers, Electricians, Water Tank, Gardeners`);

  // Link vendor to Gas Canister Refill (and optionally others)
  await prisma.vendorService.create({
    data: { vendorId: vendor.id, serviceId: serviceGas.id },
  });
  await prisma.vendorService.create({
    data: { vendorId: vendor.id, serviceId: servicePlumber.id },
  });
  console.log(`✅ Linked vendor to services: Gas Canister Refill, Plumbers`);

  // Create 2 Service providers
  console.log('🚗 Creating service providers...');
  const sp1 = await prisma.serviceProvider.create({
    data: {
      vendorId: vendor.id,
      name: 'Ahmad Al-Mahmoud',
      phone: '+962792345678', // Note: Encrypt in production
      extraInfo: {
        type: 'Truck',
        plateNumber: 'AMM-1234',
        capacity: '20 cylinders',
      },
      currentLatitude: 31.9500,
      currentLongitude: 35.9100,
      isAvailable: true,
      rating: 4.8,
      totalJobs: 0,
    },
  });

  const sp2 = await prisma.serviceProvider.create({
    data: {
      vendorId: vendor.id,
      name: 'Mohammed Al-Zahra',
      phone: '+962793456789', // Note: Encrypt in production
      extraInfo: {
        type: 'Van',
        plateNumber: 'AMM-5678',
        capacity: '15 cylinders',
      },
      currentLatitude: 31.9600,
      currentLongitude: 35.9200,
      isAvailable: true,
      rating: 4.6,
      totalJobs: 0,
    },
  });
  console.log(`✅ Created service providers: ${sp1.name}, ${sp2.name}`);

  // Create 3 Users
  console.log('👤 Creating users...');
  const user1 = await prisma.user.create({
    data: {
      name: 'Sami Al-Hashimi',
      phone: '+962794567890', // Note: Encrypt in production
      email: 'sami@example.com',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Fatima Al-Rashid',
      phone: '+962795678901', // Note: Encrypt in production
      email: 'fatima@example.com',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Omar Al-Dabbagh',
      phone: '+962796789012', // Note: Encrypt in production
      email: 'omar@example.com',
    },
  });

  // Create seed admin user for admin panel when SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD are set in .env
  if (SEED_ADMIN_USERNAME && SEED_ADMIN_PASSWORD) {
    const adminPasswordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        phone: `admin-${SEED_ADMIN_USERNAME}`,
        name: 'Admin',
        username: SEED_ADMIN_USERNAME,
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Created admin user (username: ${SEED_ADMIN_USERNAME}). Set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD in .env to create an admin.`);
  } else {
    console.log('⏭️ Skipped admin user (set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD in .env to create one).');
  }
  console.log(`✅ Created users: ${user1.name}, ${user2.name}, ${user3.name}`);

  // Create addresses for users
  console.log('📍 Creating addresses...');
  const address1 = await prisma.address.create({
    data: {
      userId: user1.id,
      label: 'HOME',
      addressLine: '123 Jabal Amman, Building 5, Apartment 12',
      city: 'Amman',
      latitude: 31.9540,
      longitude: 35.9110,
      isDefault: true,
    },
  });

  const address2 = await prisma.address.create({
    data: {
      userId: user1.id,
      label: 'WORK',
      addressLine: '456 King Abdullah II Street, Office 301',
      city: 'Amman',
      latitude: 31.9550,
      longitude: 35.9120,
      isDefault: false,
    },
  });

  const address3 = await prisma.address.create({
    data: {
      userId: user2.id,
      label: 'HOME',
      addressLine: '789 Abdoun Circle, Villa 8',
      city: 'Amman',
      latitude: 31.9560,
      longitude: 35.9130,
      isDefault: true,
    },
  });

  const address4 = await prisma.address.create({
    data: {
      userId: user3.id,
      label: 'HOME',
      addressLine: '321 Shmeisani, Building 10, Floor 3',
      city: 'Amman',
      latitude: 31.9570,
      longitude: 35.9140,
      isDefault: true,
    },
  });
  console.log(`✅ Created ${4} addresses`);

  // Create sample orders
  console.log('📋 Creating sample orders...');
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-001`,
      userId: user1.id,
      vendorId: vendor.id,
      serviceProviderId: sp1.id,
      addressId: address1.id,
      status: 'DELIVERED',
      quantity: 2,
      unitPrice: 8.5,
      serviceFee: 2.0,
      totalPrice: 19.0,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-002`,
      userId: user2.id,
      vendorId: vendor.id,
      addressId: address3.id,
      status: 'EN_ROUTE',
      quantity: 1,
      unitPrice: 8.5,
      serviceFee: 2.0,
      totalPrice: 10.5,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-003`,
      userId: user3.id,
      vendorId: vendor.id,
      addressId: address4.id,
      status: 'PENDING',
      quantity: 1,
      unitPrice: 8.5,
      serviceFee: 2.0,
      totalPrice: 10.5,
      paymentStatus: 'PENDING',
    },
  });
  console.log(`✅ Created ${3} orders`);

  // Create order status history
  console.log('📜 Creating order status history...');
  await prisma.orderStatusHistory.createMany({
    data: [
      {
        orderId: order1.id,
        status: 'PENDING',
        notes: 'Order placed',
      },
      {
        orderId: order1.id,
        status: 'ACCEPTED',
        notes: 'Vendor accepted order',
      },
      {
        orderId: order1.id,
        status: 'ASSIGNED',
        notes: `Assigned to service provider ${sp1.name}`,
      },
      {
        orderId: order1.id,
        status: 'EN_ROUTE',
        notes: 'Driver on the way',
      },
      {
        orderId: order1.id,
        status: 'DELIVERED',
        notes: 'Order delivered successfully',
      },
      {
        orderId: order2.id,
        status: 'PENDING',
        notes: 'Order placed',
      },
      {
        orderId: order2.id,
        status: 'ACCEPTED',
        notes: 'Vendor accepted order',
      },
      {
        orderId: order2.id,
        status: 'ASSIGNED',
        notes: 'Driver assignment pending',
      },
      {
        orderId: order2.id,
        status: 'EN_ROUTE',
        notes: 'Driver on the way',
      },
      {
        orderId: order3.id,
        status: 'PENDING',
        notes: 'Order placed, awaiting vendor confirmation',
      },
    ],
  });
  console.log(`✅ Created order status history entries`);

  // Create payments
  console.log('💳 Creating payments...');
  await prisma.payment.create({
    data: {
      orderId: order1.id,
      userId: user1.id,
      amount: 19.0,
      method: 'CASH',
      status: 'PAID',
      transactionId: 'TXN-CASH-001',
      metadata: {
        paidAt: new Date().toISOString(),
        receiptNumber: 'RCP-001',
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      userId: user2.id,
      amount: 10.5,
      method: 'CARD',
      status: 'PAID',
      transactionId: 'TXN-CARD-002',
      metadata: {
        paidAt: new Date().toISOString(),
        cardLast4: '1234',
        receiptNumber: 'RCP-002',
      },
    },
  });
  console.log(`✅ Created payments`);

  // Create ratings
  console.log('⭐ Creating ratings...');
  await prisma.rating.create({
    data: {
      orderId: order1.id,
      userId: user1.id,
      serviceProviderId: sp1.id,
      vendorId: vendor.id,
      rating: 5,
      comment: 'Excellent service! Very fast delivery.',
    },
  });
  console.log(`✅ Created rating`);

  // Update vendor and service provider statistics
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { totalOrders: 3 },
  });

  await prisma.serviceProvider.update({
    where: { id: sp1.id },
    data: { totalJobs: 1 },
  });

  console.log('✅ Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Vendor: ${vendor.name}`);
  console.log(`   - 2 Service providers`);
  console.log(`   - 3 Users`);
  console.log(`   - 4 Addresses`);
  console.log(`   - 3 Orders`);
  console.log(`   - 2 Payments`);
  console.log(`   - 1 Rating`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

