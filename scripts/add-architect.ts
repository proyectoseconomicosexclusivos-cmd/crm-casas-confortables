import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.findFirst()
  if (!company) {
    console.log('No company found')
    return
  }

  const hashedPassword = await bcrypt.hash('Arquitecto123!', 10)
  
  const architect = await prisma.user.upsert({
    where: { email: 'arquitecto@casasconfortables.com' },
    update: {},
    create: {
      id: 'architect-1',
      email: 'arquitecto@casasconfortables.com',
      name: 'Roberto Arquitecto',
      password: hashedPassword,
      role: 'ARCHITECT' as UserRole,
      companyId: company.id,
      isActive: true
    }
  })
  
  console.log('Arquitecto creado:', architect.email)
  console.log('Password: Arquitecto123!')
}

main().finally(() => prisma.$disconnect())
