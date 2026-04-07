'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  HardHat,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Bell,
  Search,
  Moon,
  Sun,
  Factory,
  Trophy,
  DollarSign,
  Sparkles,
  PenTool,
  Eye,
  Package,
  ShoppingBag,
  FileCheck,
  FileSpreadsheet,
  Coins,
  FileSearch,
  FolderOpen,
  Link2,
  UserCheck,
  ScrollText,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore, useNotificationsStore } from '@/hooks/use-store';
import { useAuth, useUserInitials } from '@/hooks/use-auth';
import { ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: FolderKanban },
  { name: 'Obras', href: '/works', icon: HardHat },
  { name: 'Proyectos Arq.', href: '/architect', icon: PenTool, roles: ['ARCHITECT', 'ADMIN', 'SUPER_ADMIN'] },
  { name: 'Portal Cliente', href: '/client-portal', icon: Eye, roles: ['CLIENT'] },
  { name: 'Producción', href: '/production', icon: Factory },
  { name: 'Subcontratas', href: '/subcontractors', icon: Users },
  // Catálogos y Pedidos
  { name: 'Catálogo Materiales', href: '/materials', icon: Package },
  { name: 'Catálogo Merch', href: '/merch', icon: ShoppingBag },
  { name: 'Pedidos Materiales', href: '/material-orders', icon: Package },
  { name: 'Pedidos Merch', href: '/merch-orders', icon: ShoppingBag },
  // Certificaciones y Presupuestos
  { name: 'Certificaciones', href: '/certifications', icon: FileCheck },
  { name: 'Certif. Empleados', href: '/employee-certifications', icon: UserCheck },
  { name: 'Pptos. Subcontratas', href: '/subcontractor-budgets', icon: FileSpreadsheet },
  { name: 'Profit Share', href: '/profit-share', icon: Coins },
  // Contratos y Documentos
  { name: 'Contratos', href: '/contracts', icon: ScrollText },
  { name: 'Biblioteca Docs', href: '/document-library', icon: FolderOpen },
  { name: 'Análisis Docs IA', href: '/document-analysis', icon: FileSearch },
  // Enlaces y Herramientas
  { name: 'Enlaces Externos', href: '/external-links', icon: Link2 },
  // Otros módulos
  { name: 'Gamificación', href: '/gamification', icon: Trophy },
  { name: 'Comisiones', href: '/commissions', icon: DollarSign },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Empresas', href: '/companies', icon: Building2 },
  { name: 'Documentos', href: '/documents', icon: FileText },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

// Enlace especial para el asistente AI
const aiAssistantLink = { name: 'Asistente AI', href: '/assistant', icon: Sparkles };

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed, theme, setTheme } = useUIStore();
  const { user, logout } = useAuth();
  const initials = useUserInitials();

  // Si no hay sesión, no mostrar layout
  const { status } = useSession();
  if (status !== 'authenticated') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                Casas Confortables
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapsed}
            className="ml-auto"
          >
            <ChevronLeft
              className={cn(
                'w-4 h-4 transition-transform',
                sidebarCollapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation
            .filter((item) => {
              if (!item.roles) return true;
              return user?.role && item.roles.includes(user.role);
            })
            .map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-emerald-600 text-white text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {user?.name} {user?.lastName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.role ? ROLE_LABELS[user.role] : ''}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 mr-2" />
                ) : (
                  <Moon className="w-4 h-4 mr-2" />
                )}
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar leads, clientes..."
                  className="w-64 pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/assistant">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
