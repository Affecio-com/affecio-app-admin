import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const SEED_ADMINS = [
  {
    email: "admin@affecio.com",
    password: "admin@123",
    name: "Super Admin",
    role: "super_admin" as const,
  },
  {
    email: "trust@affecio.com",
    password: "trust@123",
    name: "Trust & Safety",
    role: "admin" as const,
  },
  {
    email: "support@affecio.com",
    password: "support@123",
    name: "Customer Support",
    role: "support" as const,
  },
  {
    email: "dev@affecio.com",
    password: "developer@123",
    name: "Developer",
    role: "developer" as const,
  },
];

async function main() {
  for (const admin of SEED_ADMINS) {
    const passwordHash = await bcrypt.hash(admin.password, 12);
    await prisma.adminUser.upsert({
      where: { email: admin.email },
      update: {
        passwordHash,
        name: admin.name,
        role: admin.role,
      },
      create: {
        email: admin.email,
        passwordHash,
        name: admin.name,
        role: admin.role,
      },
    });
    console.log(`✓ ${admin.email} (${admin.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
