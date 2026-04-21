/**
 * Usage:
 * 1. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your environment.
 * 2. Optionally set SEED_ADMIN_NAME.
 * 3. Run: npx prisma db seed
 *
 * The seed is idempotent: it upserts the admin user by email and refreshes
 * name, password hash, and role on repeat runs.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requireEnv(name: "SEED_ADMIN_EMAIL" | "SEED_ADMIN_PASSWORD"): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for prisma seed`);
  }

  return value;
}

async function main() {
  const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("SEED_ADMIN_PASSWORD");
  const name = process.env.SEED_ADMIN_NAME?.trim() || null;
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      password: passwordHash,
      role: "ADMIN",
    },
    update: {
      name,
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Seeded admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error("Prisma seed failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
