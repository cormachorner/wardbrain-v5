import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create demo users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wardbrain.com' },
    update: {},
    create: {
      email: 'admin@wardbrain.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@wardbrain.com' },
    update: {},
    create: {
      email: 'instructor@wardbrain.com',
      name: 'Dr. Smith',
      role: 'INSTRUCTOR',
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@wardbrain.com' },
    update: {},
    create: {
      email: 'student@wardbrain.com',
      name: 'Medical Student',
      role: 'STUDENT',
    },
  })

  console.log('Demo users created:', { admin, instructor, student })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })