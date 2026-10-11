import { PrismaClient, RoleType, CouponDiscountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error(
      "Set SEED_ADMIN_PASSWORD in your local environment (minimum 12 characters) before running the seed. Do not commit passwords."
    );
  }

  const permissions = [
    ["dashboard.read", "View dashboard"],
    ["users.read", "View users"],
    ["users.manage", "Manage users"],
    ["services.manage", "Manage categories and services"],
    ["bookings.read", "View bookings"],
    ["bookings.manage", "Manage bookings and dispatch"],
    ["payments.read", "View payments"],
    ["payments.manage", "Manage payments and refunds"],
    ["partners.manage", "Manage partners and KYC"],
    ["reports.read", "View reports"],
    ["settings.manage", "Manage business settings"],
    ["audit.read", "View audit logs"],
    ["ai.manage", "Manage AI tools and automation"]
  ] as const;

  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description }
    });
  }

  const roleDefinitions = [
    { type: RoleType.SUPER_ADMIN, name: "Super Admin", description: "Full platform access" },
    { type: RoleType.ADMIN, name: "Admin", description: "Administrative access" },
    { type: RoleType.MANAGER, name: "Manager", description: "Operations and reporting access" },
    { type: RoleType.SUPPORT, name: "Support", description: "Customer support access" },
    { type: RoleType.CUSTOMER, name: "Customer", description: "Customer account" },
    { type: RoleType.PARTNER, name: "Partner", description: "Service partner account" }
  ];

  const roleRecords = new Map<RoleType, string>();
  for (const definition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { type: definition.type },
      update: { name: definition.name, description: definition.description, isSystem: true },
      create: { ...definition, isSystem: true }
    });
    roleRecords.set(definition.type, role.id);
  }

  const permissionRecords = await prisma.permission.findMany();
  const superAdminRoleId = roleRecords.get(RoleType.SUPER_ADMIN)!;
  for (const permission of permissionRecords) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRoleId, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRoleId, permissionId: permission.id }
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const owner = await prisma.user.upsert({
    where: { email: "admin@bharatproexpert.com" },
    update: { name: "Anil Chauhan", phone: "8920252647", passwordHash, status: "ACTIVE" },
    create: {
      name: "Anil Chauhan",
      email: "admin@bharatproexpert.com",
      phone: "8920252647",
      passwordHash,
      userRoles: { create: { roleId: superAdminRoleId } }
    }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: owner.id, roleId: superAdminRoleId } },
    update: {},
    create: { userId: owner.id, roleId: superAdminRoleId }
  });

  const managerRoleId = roleRecords.get(RoleType.MANAGER)!;
  const manager = await prisma.user.upsert({
    where: { email: "Bharatproexpert@gmail.com" },
    update: { name: "Bharat Pro Expert Manager", status: "ACTIVE" },
    create: { name: "Bharat Pro Expert Manager", email: "Bharatproexpert@gmail.com" }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: manager.id, roleId: managerRoleId } },
    update: {},
    create: { userId: manager.id, roleId: managerRoleId }
  });

  await prisma.businessInfo.upsert({
    where: { id: "primary" },
    update: {
      businessName: "Bharat Pro Expert Home Services",
      ownerName: "Anil Chauhan",
      supportEmail: "Bharatproexpert@gmail.com",
      businessEmail: "Bharatproexperthomeservices@gmail.com",
      supportPhone: "8920252647",
      currency: "INR",
      timezone: "Asia/Kolkata",
      brandPrimary: "#6C3CE9",
      brandBackground: "#FFFFFF"
    },
    create: { id: "primary" }
  });

  const categoryDefinitions = [
    { name: "Cleaning", slug: "cleaning", description: "Home and commercial cleaning services", services: [
      ["Full Home Cleaning", "full-home-cleaning", 2499, 180],
      ["Kitchen Deep Cleaning", "kitchen-deep-cleaning", 999, 90],
      ["Bathroom Deep Cleaning", "bathroom-deep-cleaning", 499, 60],
      ["Sofa and Carpet Cleaning", "sofa-carpet-cleaning", 799, 60]
    ]},
    { name: "Plumbing", slug: "plumbing", description: "Plumbing repairs and installations", services: [
      ["Tap Repair", "tap-repair", 249, 30],
      ["Drain Cleaning", "drain-cleaning", 499, 45],
      ["Wash Basin Installation", "wash-basin-installation", 799, 60]
    ]},
    { name: "Electrician", slug: "electrician", description: "Electrical repair and installation", services: [
      ["Fan Installation", "fan-installation", 299, 30],
      ["Switchboard Repair", "switchboard-repair", 249, 30],
      ["Light Installation", "light-installation", 199, 20]
    ]},
    { name: "Beauty", slug: "beauty", description: "At-home personal care services", services: [
      ["Basic Facial", "basic-facial", 699, 60],
      ["Manicure", "manicure", 399, 45],
      ["Pedicure", "pedicure", 499, 45]
    ]},
    { name: "Appliance Repair", slug: "appliance-repair", description: "Home appliance diagnostics and repair", services: [
      ["Washing Machine Inspection", "washing-machine-inspection", 299, 30],
      ["Refrigerator Inspection", "refrigerator-inspection", 299, 30],
      ["Air Conditioner Service", "air-conditioner-service", 599, 60]
    ]},
    { name: "Painting", slug: "painting", description: "Interior painting and touch-ups", services: [
      ["Wall Touch-up", "wall-touch-up", 499, 60],
      ["Room Painting Consultation", "room-painting-consultation", 199, 30],
      ["Door Painting", "door-painting", 399, 45]
    ]},
    { name: "Carpentry", slug: "carpentry", description: "Furniture repairs and carpentry", services: [
      ["Door Repair", "door-repair", 299, 30],
      ["Furniture Assembly", "furniture-assembly", 499, 60],
      ["Shelf Installation", "shelf-installation", 349, 45]
    ]}
  ] as const;

  for (let categoryIndex = 0; categoryIndex < categoryDefinitions.length; categoryIndex++) {
    const definition = categoryDefinitions[categoryIndex];
    const category = await prisma.category.upsert({
      where: { slug: definition.slug },
      update: { name: definition.name, description: definition.description, sortOrder: categoryIndex, isActive: true },
      create: { name: definition.name, slug: definition.slug, description: definition.description, sortOrder: categoryIndex }
    });
    for (const [name, slug, price, durationMinutes] of definition.services) {
      await prisma.service.upsert({
        where: { slug },
        update: { name, basePrice: price, durationMinutes, isActive: true, categoryId: category.id },
        create: { name, slug, basePrice: price, durationMinutes, categoryId: category.id, isActive: true }
      });
    }
  }

  const customers = [
    { fullName: "Rahul Sharma", phone: "9000000001", email: "rahul.example@example.com" },
    { fullName: "Priya Verma", phone: "9000000002", email: "priya.example@example.com" },
    { fullName: "Amit Singh", phone: "9000000003", email: "amit.example@example.com" },
    { fullName: "Neha Gupta", phone: "9000000004", email: "neha.example@example.com" },
    { fullName: "Vikram Yadav", phone: "9000000005", email: "vikram.example@example.com" }
  ];
  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: { fullName: customer.fullName, email: customer.email },
      create: customer
    });
  }

  const partners = [
    { partnerCode: "BPE-P-0001", fullName: "Rohit Kumar", phone: "9100000001", email: "rohit.partner@example.com", hubName: "Gurugram" },
    { partnerCode: "BPE-P-0002", fullName: "Sandeep Kumar", phone: "9100000002", email: "sandeep.partner@example.com", hubName: "Delhi" },
    { partnerCode: "BPE-P-0003", fullName: "Manoj Singh", phone: "9100000003", email: "manoj.partner@example.com", hubName: "Noida" },
    { partnerCode: "BPE-P-0004", fullName: "Deepak Verma", phone: "9100000004", email: "deepak.partner@example.com", hubName: "Faridabad" },
    { partnerCode: "BPE-P-0005", fullName: "Arun Yadav", phone: "9100000005", email: "arun.partner@example.com", hubName: "Ghaziabad" }
  ];
  for (const partner of partners) {
    await prisma.partner.upsert({
      where: { partnerCode: partner.partnerCode },
      update: { fullName: partner.fullName, phone: partner.phone, email: partner.email, hubName: partner.hubName },
      create: { ...partner, kycStatus: "PENDING" }
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: { description: "Development seed coupon", discountType: CouponDiscountType.PERCENTAGE, discountValue: 10, isActive: true },
    create: { code: "WELCOME10", description: "Development seed coupon", discountType: CouponDiscountType.PERCENTAGE, discountValue: 10, maximumDiscount: 500, isActive: true }
  });

  console.log("Section 2 seed completed. Development sample customers/partners were upserted.");
}

main()
  .catch((error) => {
    console.error("Section 2 seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
