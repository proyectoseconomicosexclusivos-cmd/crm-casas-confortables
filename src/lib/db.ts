// Base de datos - Usa demo si no hay PostgreSQL configurado

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL.includes('user:password')) {
  // Sin base de datos configurada - usar demo
  console.log('⚠️ Usando base de datos de demostración (sin persistencia)');
}

// Si hay DATABASE_URL válida, usar Prisma
if (DATABASE_URL && !DATABASE_URL.includes('user:password')) {
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = globalThis as unknown as {
    prisma: typeof PrismaClient.prototype | undefined
  };

  export const db = globalForPrisma.prisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
} else {
  // Usar base de datos demo
  export { db } from './db-demo';
}

export default db;
