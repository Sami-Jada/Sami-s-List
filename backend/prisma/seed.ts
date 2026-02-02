import { PrismaClient, AddressLabel, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - comment out in production)
  console.log('🧹 Cleaning existing data...');
  await prisma.rating.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.driver.deleteMany();
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
      tankPrice: 8.5,
      serviceFee: 2.0,
      isActive: true,
      rating: 4.5,
      totalOrders: 0,
    },
  });
  console.log(`✅ Created vendor: ${vendor.name}`);

  // Create service categories (Popular Services)
  console.log('🔧 Creating service categories...');
  const plumber = await prisma.service.create({
    data: {
      name: 'Plumber',
      slug: 'plumber',
      iconName: 'plumber',
      isPopular: true,
      sortOrder: 1,
    },
  });
  const houseCleaner = await prisma.service.create({
    data: {
      name: 'House Cleaner',
      slug: 'house-cleaner',
      iconName: 'house-cleaner',
      isPopular: true,
      sortOrder: 2,
    },
  });
  const lawnCare = await prisma.service.create({
    data: {
      name: 'Lawn Care',
      slug: 'lawn-care',
      iconName: 'lawn-care',
      isPopular: true,
      sortOrder: 3,
    },
  });
  console.log(`✅ Created services: ${plumber.name}, ${houseCleaner.name}, ${lawnCare.name}`);

  // Optionally link vendor to services (e.g. vendor offers these categories)
  await prisma.vendorService.createMany({
    data: [
      { vendorId: vendor.id, serviceId: plumber.id },
      { vendorId: vendor.id, serviceId: houseCleaner.id },
      { vendorId: vendor.id, serviceId: lawnCare.id },
    ],
  });
  console.log('✅ Linked vendor to service categories');

  // Create 2 Drivers
  console.log('🚗 Creating drivers...');
  const driver1 = await prisma.driver.create({
    data: {
      vendorId: vendor.id,
      name: 'Ahmad Al-Mahmoud',
      phone: '+962792345678', // Note: Encrypt in production
      vehicleInfo: {
        type: 'Truck',
        plateNumber: 'AMM-1234',
        capacity: '20 cylinders',
      },
      currentLatitude: 31.9500,
      currentLongitude: 35.9100,
      isAvailable: true,
      rating: 4.8,
      totalDeliveries: 0,
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      vendorId: vendor.id,
      name: 'Mohammed Al-Zahra',
      phone: '+962793456789', // Note: Encrypt in production
      vehicleInfo: {
        type: 'Van',
        plateNumber: 'AMM-5678',
        capacity: '15 cylinders',
      },
      currentLatitude: 31.9600,
      currentLongitude: 35.9200,
      isAvailable: true,
      rating: 4.6,
      totalDeliveries: 0,
    },
  });
  console.log(`✅ Created drivers: ${driver1.name}, ${driver2.name}`);

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
  console.log(`✅ Created users: ${user1.name}, ${user2.name}, ${user3.name}`);

  // Create addresses for users
  console.log('📍 Creating addresses...');
  const address1 = await prisma.address.create({
    data: {
      userId: user1.id,
      label: AddressLabel.HOME,
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
      label: AddressLabel.WORK,
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
      label: AddressLabel.HOME,
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
      label: AddressLabel.HOME,
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
      driverId: driver1.id,
      addressId: address1.id,
      status: OrderStatus.DELIVERED,
      tankQuantity: 2,
      tankPrice: 8.5,
      serviceFee: 2.0,
      totalPrice: 19.0,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PAID,
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-002`,
      userId: user2.id,
      vendorId: vendor.id,
      addressId: address3.id,
      status: OrderStatus.EN_ROUTE,
      tankQuantity: 1,
      tankPrice: 8.5,
      serviceFee: 2.0,
      totalPrice: 10.5,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.PAID,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-003`,
      userId: user3.id,
      vendorId: vendor.id,
      addressId: address4.id,
      status: OrderStatus.PENDING,
      tankQuantity: 1,
      tankPrice: 8.5,
      serviceFee: 2.0,
      totalPrice: 10.5,
      paymentStatus: PaymentStatus.PENDING,
    },
  });
  console.log(`✅ Created ${3} orders`);

  // Create order status history
  console.log('📜 Creating order status history...');
  await prisma.orderStatusHistory.createMany({
    data: [
      {
        orderId: order1.id,
        status: OrderStatus.PENDING,
        notes: 'Order placed',
      },
      {
        orderId: order1.id,
        status: OrderStatus.ACCEPTED,
        notes: 'Vendor accepted order',
      },
      {
        orderId: order1.id,
        status: OrderStatus.ASSIGNED,
        notes: `Assigned to driver ${driver1.name}`,
      },
      {
        orderId: order1.id,
        status: OrderStatus.EN_ROUTE,
        notes: 'Driver on the way',
      },
      {
        orderId: order1.id,
        status: OrderStatus.DELIVERED,
        notes: 'Order delivered successfully',
      },
      {
        orderId: order2.id,
        status: OrderStatus.PENDING,
        notes: 'Order placed',
      },
      {
        orderId: order2.id,
        status: OrderStatus.ACCEPTED,
        notes: 'Vendor accepted order',
      },
      {
        orderId: order2.id,
        status: OrderStatus.ASSIGNED,
        notes: 'Driver assignment pending',
      },
      {
        orderId: order2.id,
        status: OrderStatus.EN_ROUTE,
        notes: 'Driver on the way',
      },
      {
        orderId: order3.id,
        status: OrderStatus.PENDING,
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
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
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
      method: PaymentMethod.CARD,
      status: PaymentStatus.PAID,
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
      driverId: driver1.id,
      vendorId: vendor.id,
      rating: 5,
      comment: 'Excellent service! Very fast delivery.',
    },
  });
  console.log(`✅ Created rating`);

  // Update vendor and driver statistics
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { totalOrders: 3 },
  });

  await prisma.driver.update({
    where: { id: driver1.id },
    data: { totalDeliveries: 1 },
  });

  console.log('✅ Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Vendor: ${vendor.name}`);
  console.log(`   - 2 Drivers`);
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

