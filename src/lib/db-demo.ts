// Base de datos en memoria para demostración
// Funciona en Vercel sin configuración externa

interface DemoUser {
  id: string;
  email: string;
  password: string;
  name: string;
  lastName: string;
  role: string;
  companyId: string;
}

interface DemoCompany {
  id: string;
  name: string;
}

interface DemoLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  type: string;
  source: string;
  companyId: string;
  createdAt: Date;
}

// Datos de demostración
const DEMO_COMPANY: DemoCompany = {
  id: 'comp_1',
  name: 'Casas Confortables'
};

const DEMO_USERS: DemoUser[] = [
  {
    id: 'user_1',
    email: 'admin@casasconfortables.com',
    password: '$2a$10$rQZ9QxZ9QxZ9QxZ9QxZ9QeJFJFJFJFJFJFJFJFJFJFJFJFJFJFJFJ', // demo123
    name: 'Administrador',
    lastName: 'Sistema',
    role: 'SUPER_ADMIN',
    companyId: 'comp_1'
  },
  {
    id: 'user_2',
    email: 'comercial@casasconfortables.com',
    password: '$2a$10$rQZ9QxZ9QxZ9QxZ9QxZ9QeJFJFJFJFJFJFJFJFJFJFJFJFJFJFJFJ', // demo123
    name: 'María',
    lastName: 'García',
    role: 'COMMERCIAL',
    companyId: 'comp_1'
  }
];

const DEMO_LEADS: DemoLead[] = [
  { id: 'lead_1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@email.com', phone: '612345678', status: 'NEW', type: 'NEW_BUILD', source: 'WEB', companyId: 'comp_1', createdAt: new Date() },
  { id: 'lead_2', firstName: 'Ana', lastName: 'López', email: 'ana@email.com', phone: '698765432', status: 'CONTACTED', type: 'REFORM', source: 'FACEBOOK', companyId: 'comp_1', createdAt: new Date() },
  { id: 'lead_3', firstName: 'Carlos', lastName: 'Martín', email: 'carlos@email.com', phone: '611223344', status: 'VISIT', type: 'NEW_BUILD', source: 'GOOGLE', companyId: 'comp_1', createdAt: new Date() },
];

// Almacenamiento en memoria global (persiste durante la sesión del servidor)
declare global {
  // eslint-disable-next-line no-var
  var demoStorage: {
    users: DemoUser[];
    companies: DemoCompany[];
    leads: DemoLead[];
    initialized: boolean;
  } | undefined;
}

function getStorage() {
  if (!global.demoStorage) {
    global.demoStorage = {
      users: [...DEMO_USERS],
      companies: [DEMO_COMPANY],
      leads: [...DEMO_LEADS],
      initialized: true
    };
  }
  return global.demoStorage;
}

// API compatible con Prisma
export const db = {
  user: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      const storage = getStorage();
      if (where.email) {
        return storage.users.find(u => u.email === where.email) || null;
      }
      if (where.id) {
        return storage.users.find(u => u.id === where.id) || null;
      }
      return null;
    },
    findMany: async () => {
      return getStorage().users;
    },
    create: async ({ data }: { data: Partial<DemoUser> }) => {
      const storage = getStorage();
      const newUser: DemoUser = {
        id: 'user_' + Date.now(),
        email: data.email || '',
        password: data.password || '',
        name: data.name || '',
        lastName: data.lastName || '',
        role: data.role || 'COMMERCIAL',
        companyId: data.companyId || 'comp_1'
      };
      storage.users.push(newUser);
      return newUser;
    },
    update: async ({ where, data }: { where: { id: string }, data: Partial<DemoUser> }) => {
      const storage = getStorage();
      const index = storage.users.findIndex(u => u.id === where.id);
      if (index >= 0) {
        storage.users[index] = { ...storage.users[index], ...data };
        return storage.users[index];
      }
      return null;
    }
  },
  company: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return getStorage().companies.find(c => c.id === where.id) || null;
    },
    findFirst: async () => {
      return getStorage().companies[0] || null;
    }
  },
  lead: {
    findMany: async ({ where, orderBy, skip, take }: any) => {
      let leads = getStorage().leads;
      if (where?.companyId) {
        leads = leads.filter(l => l.companyId === where.companyId);
      }
      if (where?.status) {
        leads = leads.filter(l => l.status === where.status);
      }
      return leads.slice(skip || 0, (skip || 0) + (take || 100));
    },
    count: async ({ where }: any) => {
      let leads = getStorage().leads;
      if (where?.companyId) {
        leads = leads.filter(l => l.companyId === where.companyId);
      }
      return leads.length;
    },
    create: async ({ data }: { data: Partial<DemoLead> }) => {
      const storage = getStorage();
      const newLead: DemoLead = {
        id: 'lead_' + Date.now(),
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        status: data.status || 'NEW',
        type: data.type || 'NEW_BUILD',
        source: data.source || 'WEB',
        companyId: data.companyId || 'comp_1',
        createdAt: new Date()
      };
      storage.leads.push(newLead);
      return newLead;
    }
  },
  $disconnect: async () => {}
};

export default db;
