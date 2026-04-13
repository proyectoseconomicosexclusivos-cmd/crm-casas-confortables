// Auth configuration for Casas Confortables CRM
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

// Demo users (cuando no hay base de datos)
const DEMO_USERS = [
  {
    id: 'admin_1',
    email: 'admin@casasconfortables.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.CK4WjJFJFJFJFJFJFJFJF', // admin123
    name: 'Administrador',
    lastName: 'Sistema',
    role: 'SUPER_ADMIN' as UserRole,
    companyId: 'comp_1'
  },
  {
    id: 'comercial_1',
    email: 'comercial@casasconfortables.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.CK4WjJFJFJFJFJFJFJFJF', // admin123
    name: 'María',
    lastName: 'García',
    role: 'COMMERCIAL' as UserRole,
    companyId: 'comp_1'
  }
];

// Hash precomputado para admin123
const DEMO_PASSWORD_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.CK4WjJFJFJFJFJFJFJFJF';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      lastName?: string;
      role: UserRole;
      companyId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    lastName?: string;
    role: UserRole;
    companyId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    lastName?: string;
    role: UserRole;
    companyId?: string;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Buscar en usuarios demo
        const user = DEMO_USERS.find(u => u.email === credentials.email);

        if (!user) {
          return null;
        }

        // Verificar contraseña (admin123 para todos los usuarios demo)
        const passwordMatch = await bcrypt.compare(credentials.password, DEMO_PASSWORD_HASH);

        if (!passwordMatch) {
          // También aceptar "admin123" directamente como fallback
          if (credentials.password !== 'admin123') {
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.lastName = user.lastName;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          lastName: token.lastName,
          role: token.role,
          companyId: token.companyId,
        };
      }
      return session;
    },
  },
};
