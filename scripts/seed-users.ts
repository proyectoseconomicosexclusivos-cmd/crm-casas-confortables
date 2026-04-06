import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Crear empresa principal
  const company = await prisma.company.upsert({
    where: { id: 'main-company' },
    update: {},
    create: {
      id: 'main-company',
      name: 'Casas Confortables',
      type: 'OWN',
      email: 'info@casasconfortables.com',
      phone: '+34 900 123 456',
      address: 'Calle Principal 123',
      city: 'Madrid',
      province: 'Madrid',
      postalCode: '28001',
      country: 'España',
      isActive: true
    }
  })

  console.log('Empresa creada:', company.name)

  // Crear usuarios con diferentes roles
  const users = [
    {
      id: 'super-admin-1',
      email: 'admin@casasconfortables.com',
      name: 'Administrador Principal',
      password: 'Admin123!',
      role: UserRole.SUPER_ADMIN
    },
    {
      id: 'admin-1',
      email: 'gerente@casasconfortables.com',
      name: 'Gerente General',
      password: 'Gerente123!',
      role: UserRole.ADMIN
    },
    {
      id: 'team-leader-1',
      email: 'jefe@casasconfortables.com',
      name: 'Jefe de Equipo',
      password: 'Jefe123!',
      role: UserRole.TEAM_LEADER
    },
    {
      id: 'commercial-1',
      email: 'comercial@casasconfortables.com',
      name: 'Juan Comercial',
      password: 'Comercial123!',
      role: UserRole.COMMERCIAL
    },
    {
      id: 'worker-1',
      email: 'trabajador@casasconfortables.com',
      name: 'Pedro Trabajador',
      password: 'Trabajador123!',
      role: UserRole.WORKER
    },
    {
      id: 'client-1',
      email: 'cliente@ejemplo.com',
      name: 'María Cliente',
      password: 'Cliente123!',
      role: UserRole.CLIENT
    }
  ]

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: hashedPassword,
        role: user.role,
        companyId: company.id,
        isActive: true
      }
    })
    
    console.log(`Usuario creado: ${user.name} (${user.role}) - Email: ${user.email} - Password: ${user.password}`)
  }

  // Crear algunos leads de prueba
  const leads = [
    {
      id: 'lead-1',
      name: 'Carlos García',
      email: 'carlos@email.com',
      phone: '+34 666 111 222',
      status: 'NEW',
      type: 'NEW_BUILD',
      source: 'WEB',
      budget: 250000,
      notes: 'Interesado en vivienda de 3 habitaciones',
      companyId: company.id,
      assignedToId: 'commercial-1'
    },
    {
      id: 'lead-2', 
      name: 'Ana Martínez',
      email: 'ana@email.com',
      phone: '+34 666 333 444',
      status: 'CONTACTED',
      type: 'REFORM',
      source: 'FACEBOOK',
      budget: 50000,
      notes: 'Reforma integral de piso',
      companyId: company.id,
      assignedToId: 'commercial-1'
    },
    {
      id: 'lead-3',
      name: 'Roberto López',
      email: 'roberto@email.com',
      phone: '+34 666 555 666',
      status: 'VISIT',
      type: 'INVESTMENT',
      source: 'REFERRAL',
      budget: 180000,
      notes: 'Inversor buscando propiedades',
      companyId: company.id,
      assignedToId: 'commercial-1'
    }
  ]

  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: {},
      create: lead as any
    })
    console.log(`Lead creado: ${lead.name}`)
  }

  // Crear obras de prueba
  const works = [
    {
      id: 'work-1',
      name: 'Villa Los Olivos',
      client: 'Familia Rodríguez',
      status: 'IN_PROGRESS',
      address: 'Urbanización Los Olivos, Parcela 15',
      city: 'Madrid',
      startDate: new Date('2024-01-15'),
      estimatedEndDate: new Date('2024-06-15'),
      budget: 350000,
      companyId: company.id,
      managerId: 'team-leader-1'
    },
    {
      id: 'work-2',
      name: 'Reforma Piso Centro',
      client: 'Dña. Carmen Ruiz',
      status: 'PLANNING',
      address: 'Calle Mayor 45, 3ºB',
      city: 'Madrid',
      startDate: new Date('2024-03-01'),
      estimatedEndDate: new Date('2024-04-30'),
      budget: 45000,
      companyId: company.id,
      managerId: 'team-leader-1'
    }
  ]

  for (const work of works) {
    await prisma.work.upsert({
      where: { id: work.id },
      update: {},
      create: work as any
    })
    console.log(`Obra creada: ${work.name}`)
  }

  // Crear tareas para trabajadores
  const tasks = [
    {
      id: 'task-1',
      title: 'Cimentación Villa Los Olivos',
      description: 'Realizar cimentación completa de la villa',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      workId: 'work-1',
      assignedToId: 'worker-1',
      dueDate: new Date('2024-02-15')
    },
    {
      id: 'task-2',
      title: 'Instalación eléctrica preliminar',
      description: 'Preparar instalaciones eléctricas',
      status: 'PENDING',
      priority: 'MEDIUM',
      workId: 'work-1',
      assignedToId: 'worker-1',
      dueDate: new Date('2024-02-20')
    }
  ]

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task as any
    })
    console.log(`Tarea creada: ${task.title}`)
  }

  console.log('\n✅ Base de datos poblada correctamente!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
