import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  })
  
  console.log('=== USUARIOS EXISTENTES ===')
  for (const user of users) {
    console.log(`- ${user.name} | ${user.email} | ${user.role}`)
  }
  console.log(`\nTotal: ${users.length} usuarios`)
}

main().finally(() => prisma.$disconnect())
