'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { UserRole, ROLE_LABELS } from '@/types';
import { hasPermission, isSuperAdmin, isAdmin } from '@/lib/permissions';

// Tipos
interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  role: UserRole;
  companyId?: string;
  officeId?: string;
  teamId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
}

// Contexto de autenticación
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasPermission: () => false,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Derivar el usuario directamente de la sesión en lugar de usar estado
  const user = status === 'authenticated' && session?.user 
    ? (session.user as User) 
    : null;

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission as any);
  };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
        hasPermission: checkPermission,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook para obtener las iniciales del usuario
export function useUserInitials() {
  const { user } = useAuth();
  if (!user) return '';
  const firstInitial = user.name?.charAt(0).toUpperCase() || '';
  const lastInitial = user.lastName?.charAt(0).toUpperCase() || '';
  return firstInitial + lastInitial || user.email?.charAt(0).toUpperCase() || '';
}

// Hook para verificar si el usuario puede acceder a cierta funcionalidad
export function useCanAccess() {
  const { user } = useAuth();

  return {
    viewAllLeads: user ? isSuperAdmin(user.role) || isAdmin(user.role) : false,
    manageUsers: user ? isSuperAdmin(user.role) || isAdmin(user.role) : false,
    manageCompanies: user ? isSuperAdmin(user.role) : false,
    viewDashboard: !!user,
    createLeads: !!user,
    viewWorks: !!user,
  };
}
