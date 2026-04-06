import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Actualizar contraseñas de usuarios existentes
  const passwordUpdates = [
    { email: 'admin@casasconfortables.com', password: 'Admin123!' },
    { email: 'lider@casasconfortables.com', password: 'Lider123!' },
    { email: 'carlos@casasconfortables.com', password: 'Carlos123!' },
    { email: 'ana@casasconfortables.com', password: 'Ana123!' },
    { email: 'pedro@casasconfortables.com', password: 'Pedro123!' }
  ]

  for (const update of passwordUpdates) {
    const hashedPassword = await bcrypt.hash(update.password, 10)
    await prisma.user.update({
      where: { email: update.email },
      data: { password: hashedPassword }
    })
  }

  // Crear usuarios faltantes
  const company = await prisma.company.findFirst()
  
  const newUsers = [
    {
      id: 'worker-1',
      email: 'trabajador@casasconfortables.com',
      name: 'José Trabajador',
      password: 'Trabajador123!',
      role: UserRole.WORKER,
      companyId: company?.id
    },
    {
      id: 'client-1',
      email: 'cliente@casasconfortables.com',
      name: 'Laura Cliente',
      password: 'Cliente123!',
      role: UserRole.CLIENT,
      companyId: company?.id
    }
  ]

  for (const user of newUsers) {
    const exists = await prisma.user.findUnique({ where: { email: user.email } })
    if (!exists) {
      const hashedPassword = await bcrypt.hash(user.password, 10)
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          password: hashedPassword,
          role: user.role,
          companyId: user.companyId,
          isActive: true
        }
      })
    }
  }

  // Mostrar todos los usuarios
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true },
    orderBy: { role: 'asc' }
  })

  console.log('\n=== CREDENCIALES DE ACCESO CRM ===\n')
  console.log('🔴 SUPER_ADMIN:')
  console.log('   Email: admin@casasconfortables.com')
  console.log('   Password: Admin123!\n')
  console.log('🟠 TEAM_LEADER:')
  console.log('   Email: lider@casasconfortables.com')
  console.log('   Password: Lider123!\n')
  console.log('🟢 COMMERCIAL:')
  console.log('   Email: carlos@casasconfortables.com')
  console.log('   Password: Carlos123!')
  console.log('   Email: ana@casasconfortables.com')
  console.log('   Password: Ana123!')
  console.log('   Email: pedro@casasconfortables.com')
  console.log('   Password: Pedro123!\n')
  console.log('🔵 WORKER:')
  console.log('   Email: trabajador@casasconfortables.com')
  console.log('   Password: Trabajador123!\n')
  console.log('🟣 CLIENT:')
  console.log('   Email: cliente@casasconfortables.com')
  console.log('   Password: Cliente123!\n')
}

main().finally(() => prisma.$disconnect())
