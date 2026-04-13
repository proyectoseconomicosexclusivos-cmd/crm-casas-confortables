// Auth configuration for Casas Confortables CRM
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { UserRole } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      lastName?: string;
      role: UserRole;
      companyId?: string;
      officeId?: string;
      teamId?: string;
      managerId?: string;
      avatar?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    lastName?: string;
    role: UserRole;
    companyId?: string;
    officeId?: string;
    teamId?: string;
    managerId?: string;
    avatar?: string;
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
    officeId?: string;
    teamId?: string;
    managerId?: string;
    avatar?: string;
  }
}

// Hash password helper
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password helper
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
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

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        if (!user.isActive) {
          throw new Error('Usuario inactivo. Contacte al administrador.');
        }

        const passwordMatch = await comparePassword(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName,
          role: user.role as UserRole,
          companyId: user.companyId || undefined,
          officeId: user.officeId || undefined,
          teamId: user.teamId || undefined,
          managerId: user.managerId || undefined,
          avatar: user.avatar || undefined,
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
        token.officeId = user.officeId;
        token.teamId = user.teamId;
        token.managerId = user.managerId;
        token.avatar = user.avatar;
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
          officeId: token.officeId,
          teamId: token.teamId,
          managerId: token.managerId,
          avatar: token.avatar,
        };
      }
      return session;
    },
  },
};
