import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

async function main() {
  console.log('🌱 Seeding database...');

  // Crear empresa principal
  const company = await db.company.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      name: 'Casas Confortables',
      type: 'OWN',
      taxId: 'B12345678',
      email: 'info@casasconfortables.com',
      phone: '+34 900 123 456',
      address: 'Calle Principal 123',
      city: 'Madrid',
      province: 'Madrid',
      postalCode: '28001',
      country: 'España',
      assignmentMethod: 'ROUND_ROBIN',
    },
  });

  console.log('✅ Company created:', company.name);

  // Crear oficina principal
  const office = await db.office.upsert({
    where: { id: 'office-1' },
    update: {},
    create: {
      id: 'office-1',
      companyId: company.id,
      name: 'Oficina Central Madrid',
      email: 'madrid@casasconfortables.com',
      phone: '+34 915 123 456',
      address: 'Calle Principal 123',
      city: 'Madrid',
      province: 'Madrid',
      postalCode: '28001',
      zones: JSON.stringify(['Madrid', 'Madrid Capital', 'Alcobendas', 'Pozuelo']),
    },
  });

  console.log('✅ Office created:', office.name);

  // Crear equipo principal
  const team = await db.team.upsert({
    where: { id: 'team-1' },
    update: {},
    create: {
      id: 'team-1',
      officeId: office.id,
      name: 'Equipo Comercial Madrid',
      description: 'Equipo comercial de la oficina central',
    },
  });

  console.log('✅ Team created:', team.name);

  // Crear usuarios
  const hashedPassword = await hashPassword('admin123');

  // Super Admin
  const superAdmin = await db.user.upsert({
    where: { email: 'admin@casasconfortables.com' },
    update: {},
    create: {
      email: 'admin@casasconfortables.com',
      password: hashedPassword,
      name: 'Administrador',
      lastName: 'Principal',
      phone: '+34 600 123 456',
      role: 'SUPER_ADMIN',
      companyId: company.id,
      officeId: office.id,
      teamId: team.id,
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Jefe de equipo
  const teamLeader = await db.user.upsert({
    where: { email: 'lider@casasconfortables.com' },
    update: {},
    create: {
      email: 'lider@casasconfortables.com',
      password: hashedPassword,
      name: 'María',
      lastName: 'García López',
      phone: '+34 601 234 567',
      role: 'TEAM_LEADER',
      companyId: company.id,
      officeId: office.id,
      teamId: team.id,
    },
  });

  console.log('✅ Team Leader created:', teamLeader.email);

  // Comerciales
  const commercials = [
    {
      email: 'carlos@casasconfortables.com',
      name: 'Carlos',
      lastName: 'Martínez Ruiz',
      phone: '+34 602 345 678',
    },
    {
      email: 'ana@casasconfortables.com',
      name: 'Ana',
      lastName: 'Fernández Soto',
      phone: '+34 603 456 789',
    },
    {
      email: 'pedro@casasconfortables.com',
      name: 'Pedro',
      lastName: 'López García',
      phone: '+34 604 567 890',
    },
  ];

  for (const commercial of commercials) {
    await db.user.upsert({
      where: { email: commercial.email },
      update: {},
      create: {
        email: commercial.email,
        password: hashedPassword,
        name: commercial.name,
        lastName: commercial.lastName,
        phone: commercial.phone,
        role: 'COMMERCIAL',
        companyId: company.id,
        officeId: office.id,
        teamId: team.id,
        managerId: teamLeader.id,
      },
    });
    console.log('✅ Commercial created:', commercial.email);
  }

  // Crear algunos leads de ejemplo
  const leads = [
    {
      firstName: 'Juan',
      lastName: 'Pérez González',
      email: 'juan.perez@email.com',
      phone: '+34 612 111 111',
      city: 'Madrid',
      province: 'Madrid',
      type: 'NEW_BUILD',
      source: 'WEB',
      status: 'NEW',
      estimatedValue: 250000,
      description: 'Busca vivienda de 3 habitaciones en zona norte de Madrid',
      priority: 1,
    },
    {
      firstName: 'Laura',
      lastName: 'Sánchez Moreno',
      email: 'laura.sanchez@email.com',
      phone: '+34 612 222 222',
      city: 'Alcobendas',
      province: 'Madrid',
      type: 'REFORM',
      source: 'FACEBOOK',
      status: 'CONTACTED',
      estimatedValue: 45000,
      description: 'Reforma integral de piso de 85m²',
      priority: 2,
    },
    {
      firstName: 'Miguel',
      lastName: 'Ruiz Torres',
      email: 'miguel.ruiz@email.com',
      phone: '+34 612 333 333',
      city: 'Pozuelo de Alarcón',
      province: 'Madrid',
      type: 'INVESTMENT',
      source: 'REFERRAL',
      status: 'VISIT',
      estimatedValue: 180000,
      description: 'Inversor buscando propiedades para alquiler',
      priority: 1,
    },
    {
      firstName: 'Elena',
      lastName: 'García Navarro',
      email: 'elena.garcia@email.com',
      phone: '+34 612 444 444',
      city: 'Madrid',
      province: 'Madrid',
      type: 'NEW_BUILD',
      source: 'GOOGLE',
      status: 'OFFER',
      estimatedValue: 320000,
      description: 'Pareja joven buscando primera vivienda',
      priority: 1,
    },
    {
      firstName: 'Roberto',
      lastName: 'Díaz Martín',
      email: 'roberto.diaz@email.com',
      phone: '+34 612 555 555',
      city: 'Las Rozas',
      province: 'Madrid',
      type: 'REFORM',
      source: 'REAL_ESTATE',
      status: 'NEGOTIATION',
      estimatedValue: 75000,
      description: 'Reforma de local comercial',
      priority: 1,
    },
    {
      firstName: 'Carmen',
      lastName: 'López Fernández',
      email: 'carmen.lopez@email.com',
      phone: '+34 612 666 666',
      city: 'Madrid',
      province: 'Madrid',
      type: 'NEW_BUILD',
      source: 'WEB',
      status: 'CLOSED',
      estimatedValue: 285000,
      description: 'Vivienda unifamiliar con jardín',
      priority: 1,
    },
    {
      firstName: 'Alberto',
      lastName: 'Moreno Soto',
      email: 'alberto.moreno@email.com',
      phone: '+34 612 777 777',
      city: 'Alcalá de Henares',
      province: 'Madrid',
      type: 'INVESTMENT',
      source: 'FAIR',
      status: 'LOST',
      estimatedValue: 150000,
      description: 'No tenía financiación disponible',
      priority: 3,
    },
  ];

  for (const lead of leads) {
    await db.lead.create({
      data: {
        ...lead,
        companyId: company.id,
        officeId: office.id,
        teamId: team.id,
        createdById: superAdmin.id,
        assignedToId: teamLeader.id,
        probability: lead.status === 'CLOSED' ? 100 : lead.status === 'LOST' ? 0 : 50,
      },
    });
  }

  console.log('✅ Sample leads created');

  // Crear subcontratas de ejemplo
  const subcontractorUsers = [
    {
      email: 'electricidad@subcontrata.com',
      name: 'Electricidad',
      lastName: 'García S.L.',
      phone: '+34 620 111 222',
      specialty: 'Electricista',
      businessName: 'Electricidad García S.L.',
    },
    {
      email: 'fontaneria@subcontrata.com',
      name: 'Fontanería',
      lastName: 'Martín S.L.',
      phone: '+34 620 222 333',
      specialty: 'Fontanero',
      businessName: 'Fontanería Martín S.L.',
    },
    {
      email: 'cerramientos@subcontrata.com',
      name: 'Cerramientos',
      lastName: 'López S.L.',
      phone: '+34 620 333 444',
      specialty: 'Cerramientos',
      businessName: 'Cerramientos López S.L.',
    },
  ];

  for (const sub of subcontractorUsers) {
    const user = await db.user.upsert({
      where: { email: sub.email },
      update: {},
      create: {
        email: sub.email,
        password: hashedPassword,
        name: sub.name,
        lastName: sub.lastName,
        phone: sub.phone,
        role: 'SUBCONTRACTOR',
        companyId: company.id,
      },
    });

    // Crear perfil de subcontrata
    await db.subcontractorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyId: company.id,
        businessName: sub.businessName,
        specialty: sub.specialty,
        taxId: `B${Math.floor(Math.random() * 10000000)}`,
        rating: 3.5 + Math.random() * 1.5,
        totalWorks: Math.floor(Math.random() * 20) + 5,
        completedWorks: Math.floor(Math.random() * 15) + 3,
        onTimeRate: 70 + Math.random() * 30,
        qualityScore: 3 + Math.random() * 2,
        maxAdvancePercent: 10,
        paymentTerms: 30,
        isActive: true,
        isVerified: true,
      },
    });
    console.log('✅ Subcontractor created:', sub.email);
  }

  // Crear plantilla de contrato
  await db.contractTemplate.upsert({
    where: { id: 'contract-template-1' },
    update: {},
    create: {
      id: 'contract-template-1',
      companyId: company.id,
      name: 'Contrato Estándar de Subcontrata',
      description: 'Plantilla estándar para contratos de subcontratación de obras',
      content: `
        <h1>CONTRATO DE SUBCONTRATACIÓN</h1>
        <p>En [CIUDAD], a [FECHA]</p>
        <p>De una parte, [EMPRESA], con CIF [CIF_EMPRESA]...</p>
        <p>De otra parte, [SUBCONTRATA], con CIF [CIF_SUBCONTRATA]...</p>
        <h2>CLÁUSULAS</h2>
        <p>PRIMERA.- Objeto del contrato...</p>
        <p>SEGUNDA.- Importe y forma de pago...</p>
        <p>TERCERA.- Plazo de ejecución...</p>
      `,
      clauses: JSON.stringify([
        { id: '1', title: 'Pago por fases validadas', content: 'El pago se realizará únicamente tras la validación de cada fase de trabajo' },
        { id: '2', title: 'Penalización por retraso', content: 'Por cada día de retraso se aplicará una penalización' },
        { id: '3', title: 'Garantía de anticipo', content: 'Todo anticipo requiere garantía bancaria o seguro de caución' },
      ]),
      defaultDelayPenalty: 100,
      defaultInactivityPenalty: 200,
      defaultBreachPenalty: 500,
    },
  });

  console.log('✅ Contract template created');

  // Crear checklist de validación
  await db.validationChecklist.upsert({
    where: { id: 'checklist-1' },
    update: {},
    create: {
      id: 'checklist-1',
      companyId: company.id,
      name: 'Validación de Estructura',
      category: 'estructura',
      description: 'Checklist para validación de trabajos de estructura',
      items: JSON.stringify([
        { id: '1', label: 'Cimentación correcta', required: true, type: 'boolean' },
        { id: '2', label: 'Pilares alineados', required: true, type: 'boolean' },
        { id: '3', label: 'Vigas niveladas', required: true, type: 'boolean' },
        { id: '4', label: 'Fotos de evidencia', required: true, type: 'photo' },
        { id: '5', label: 'Observaciones', required: false, type: 'text' },
      ]),
    },
  });

  console.log('✅ Validation checklist created');

  // Crear algunos logros
  const achievements = [
    {
      name: 'Primera Venta',
      description: 'Cierra tu primera venta',
      icon: '🎯',
      type: 'SALES',
      category: 'bronze',
      points: 100,
      requirement: JSON.stringify({ sales: 1 }),
    },
    {
      name: 'Vendedor Estrella',
      description: 'Cierra 10 ventas',
      icon: '⭐',
      type: 'SALES',
      category: 'silver',
      points: 500,
      requirement: JSON.stringify({ sales: 10 }),
    },
    {
      name: 'Máquina de Leads',
      description: 'Crea 50 leads',
      icon: '📊',
      type: 'LEADS',
      category: 'bronze',
      points: 200,
      requirement: JSON.stringify({ leadsCreated: 50 }),
    },
    {
      name: 'Obra Completada',
      description: 'Completa tu primera obra',
      icon: '🏗️',
      type: 'WORKS',
      category: 'bronze',
      points: 150,
      requirement: JSON.stringify({ worksCompleted: 1 }),
    },
    {
      name: 'Cumplidor',
      description: 'Completa 5 tareas a tiempo',
      icon: '✅',
      type: 'ACTIVITY',
      category: 'bronze',
      points: 100,
      requirement: JSON.stringify({ tasksOnTime: 5 }),
    },
  ];

  for (const achievement of achievements) {
    await db.achievement.upsert({
      where: { id: `achievement-${achievement.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `achievement-${achievement.name.toLowerCase().replace(/\s+/g, '-')}`,
        companyId: company.id,
        ...achievement,
      },
    });
  }

  console.log('✅ Achievements created');

  // Crear trabajadores
  const workers = [
    {
      email: 'trabajador1@casasconfortables.com',
      name: 'Antonio',
      lastName: 'Sánchez Pérez',
      phone: '+34 610 111 000',
    },
    {
      email: 'trabajador2@casasconfortables.com',
      name: 'Luis',
      lastName: 'Martín García',
      phone: '+34 610 222 000',
    },
    {
      email: 'trabajador3@casasconfortables.com',
      name: 'José',
      lastName: 'Ruiz Fernández',
      phone: '+34 610 333 000',
    },
  ];

  for (const worker of workers) {
    await db.user.upsert({
      where: { email: worker.email },
      update: {},
      create: {
        email: worker.email,
        password: hashedPassword,
        name: worker.name,
        lastName: worker.lastName,
        phone: worker.phone,
        role: 'WORKER',
        companyId: company.id,
        officeId: office.id,
        teamId: team.id,
      },
    });
    console.log('✅ Worker created:', worker.email);
  }

  // Crear cliente de ejemplo
  await db.user.upsert({
    where: { email: 'cliente@ejemplo.com' },
    update: {},
    create: {
      email: 'cliente@ejemplo.com',
      password: hashedPassword,
      name: 'Juan',
      lastName: 'Cliente Ejemplo',
      phone: '+34 611 222 333',
      role: 'CLIENT',
      companyId: company.id,
    },
  });
  console.log('✅ Client user created');

  // Crear configuración de alertas automáticas
  const alertRules = [
    {
      name: 'Lead frío - Sin contacto 3 días',
      description: 'Alerta cuando un lead lleva 3 días sin contacto',
      type: 'LEAD_COLD',
      severity: 'WARNING',
      conditions: JSON.stringify({ daysWithoutContact: 3 }),
    },
    {
      name: 'Lead caliente sin seguimiento',
      description: 'Alerta para leads con alta probabilidad sin actividad',
      type: 'LEAD_HOT',
      severity: 'CRITICAL',
      conditions: JSON.stringify({ probabilityMin: 70, daysWithoutContact: 1 }),
    },
    {
      name: 'Obra retrasada',
      description: 'Alerta cuando una obra supera la fecha estimada',
      type: 'WORK_DELAY',
      severity: 'WARNING',
      conditions: JSON.stringify({ daysOverdue: 1 }),
    },
    {
      name: 'Tarea vencida',
      description: 'Alerta para tareas que superan su fecha límite',
      type: 'TASK_OVERDUE',
      severity: 'WARNING',
      conditions: JSON.stringify({ daysOverdue: 0 }),
    },
  ];

  for (const rule of alertRules) {
    await db.alertRule.create({
      data: {
        companyId: company.id,
        ...rule,
        notifyEmail: true,
        notifyPush: true,
        notifyUser: true,
        notifyManager: true,
        isActive: true,
      },
    });
  }
  console.log('✅ Alert rules created');

  // Crear horarios de trabajadores
  for (const worker of workers) {
    const user = await db.user.findUnique({ where: { email: worker.email } });
    if (user) {
      await db.workerSchedule.create({
        data: {
          userId: user.id,
          companyId: company.id,
          weeklySchedule: JSON.stringify({
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: { start: '08:00', end: '15:00' },
          }),
          workHoursPerDay: 8,
          workDaysPerWeek: 5,
          vacationDays: 22,
        },
      });
    }
  }
  console.log('✅ Worker schedules created');

  // Crear tareas de ejemplo
  const taskData = [
    { title: 'Llamar a Juan Pérez', priority: 'high', status: 'pending' },
    { title: 'Enviar presupuesto a Laura', priority: 'high', status: 'in_progress' },
    { title: 'Programar visita con Miguel', priority: 'medium', status: 'pending' },
    { title: 'Revisar documentación Elena', priority: 'medium', status: 'pending' },
    { title: 'Preparar contrato Roberto', priority: 'high', status: 'completed' },
  ];

  for (const task of taskData) {
    await db.task.create({
      data: {
        title: task.title,
        description: `Tarea: ${task.title}`,
        priority: task.priority,
        status: task.status,
        createdById: superAdmin.id,
        assignedToId: teamLeader.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log('✅ Sample tasks created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
