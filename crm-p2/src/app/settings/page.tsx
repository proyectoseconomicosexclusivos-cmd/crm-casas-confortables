'use client';

import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Users,
  Shield,
  Bell,
  Link2,
  Save,
  Loader2,
  Plus,
  Mail,
  MessageSquare,
  Globe,
  Key,
  User,
  Edit,
  Trash2,
} from 'lucide-react';
import { ROLE_LABELS } from '@/types';

interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  company?: { id: string; name: string };
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'Casas Confortables',
    companyEmail: 'info@casasconfortables.com',
    companyPhone: '+34 900 000 000',
    timezone: 'Europe/Madrid',
    language: 'es',
    currency: 'EUR',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewLead: true,
    emailLeadAssigned: true,
    emailWorkUpdate: true,
    whatsappNewLead: false,
    whatsappLeadAssigned: false,
    dailyReport: true,
    weeklyReport: false,
  });

  // Integration settings
  const [integrationSettings, setIntegrationSettings] = useState({
    whatsappApi: '',
    emailSmtp: 'smtp.example.com',
    emailPort: '587',
    emailUser: '',
    emailPassword: '',
  });

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    lastName: '',
    email: '',
    role: 'COMMERCIAL',
    password: '',
  });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setLoading(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleSaveIntegrations = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        setNewUserForm({
          name: '',
          lastName: '',
          email: '',
          role: 'COMMERCIAL',
          password: '',
        });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gestiona la configuración del sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Integraciones</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Configura los ajustes generales del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la empresa</Label>
                  <Input
                    id="companyName"
                    value={generalSettings.companyName}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, companyName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email de la empresa</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={generalSettings.companyEmail}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, companyEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Teléfono</Label>
                  <Input
                    id="companyPhone"
                    value={generalSettings.companyPhone}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, companyPhone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
                      <SelectItem value="America/Mexico_City">America/Mexico_City</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={generalSettings.currency}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="MXN">MXN ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveGeneral}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Settings */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gestión de Usuarios
                  </CardTitle>
                  <CardDescription>
                    Administra los usuarios del sistema
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                      <DialogDescription>
                        Complete los datos para crear un nuevo usuario
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="userName">Nombre *</Label>
                            <Input
                              id="userName"
                              value={newUserForm.name}
                              onChange={(e) =>
                                setNewUserForm({ ...newUserForm, name: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="userLastName">Apellidos</Label>
                            <Input
                              id="userLastName"
                              value={newUserForm.lastName}
                              onChange={(e) =>
                                setNewUserForm({ ...newUserForm, lastName: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="userEmail">Email *</Label>
                          <Input
                            id="userEmail"
                            type="email"
                            value={newUserForm.email}
                            onChange={(e) =>
                              setNewUserForm({ ...newUserForm, email: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="userRole">Rol</Label>
                            <Select
                              value={newUserForm.role}
                              onValueChange={(value) =>
                                setNewUserForm({ ...newUserForm, role: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="userPassword">Contraseña *</Label>
                            <Input
                              id="userPassword"
                              type="password"
                              value={newUserForm.password}
                              onChange={(e) =>
                                setNewUserForm({ ...newUserForm, password: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Crear Usuario
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-emerald-600" />
                              </div>
                              <span className="font-medium">
                                {user.name} {user.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.company?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.isActive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-gray-50 text-gray-500'
                              }
                            >
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Settings */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configuración de Roles
              </CardTitle>
              <CardDescription>
                Permisos y configuración por rol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-medium">{label}</div>
                            <div className="text-sm text-gray-500">Rol del sistema</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Permisos
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configuración de Notificaciones
              </CardTitle>
              <CardDescription>
                Configura las alertas y notificaciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Notificaciones por Email
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Nuevo lead asignado</Label>
                      <p className="text-sm text-gray-500">Recibir email cuando se asigne un nuevo lead</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNewLead}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailNewLead: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Lead asignado a comercial</Label>
                      <p className="text-sm text-gray-500">Notificar al comercial cuando reciba un lead</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailLeadAssigned}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailLeadAssigned: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Actualizaciones de obra</Label>
                      <p className="text-sm text-gray-500">Recibir email con actualizaciones de obras</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailWorkUpdate}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailWorkUpdate: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notificaciones por WhatsApp
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Nuevo lead</Label>
                      <p className="text-sm text-gray-500">Enviar WhatsApp cuando llegue un nuevo lead</p>
                    </div>
                    <Switch
                      checked={notificationSettings.whatsappNewLead}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, whatsappNewLead: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Lead asignado</Label>
                      <p className="text-sm text-gray-500">Notificar por WhatsApp asignaciones</p>
                    </div>
                    <Switch
                      checked={notificationSettings.whatsappLeadAssigned}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, whatsappLeadAssigned: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Reportes Automáticos</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reporte diario</Label>
                      <p className="text-sm text-gray-500">Recibir resumen diario de actividad</p>
                    </div>
                    <Switch
                      checked={notificationSettings.dailyReport}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, dailyReport: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reporte semanal</Label>
                      <p className="text-sm text-gray-500">Recibir resumen semanal de métricas</p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReport}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, weeklyReport: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  WhatsApp Business API
                </CardTitle>
                <CardDescription>
                  Configura la integración con WhatsApp Business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="whatsappApi">API Key / Token</Label>
                  <Input
                    id="whatsappApi"
                    type="password"
                    value={integrationSettings.whatsappApi}
                    onChange={(e) =>
                      setIntegrationSettings({ ...integrationSettings, whatsappApi: e.target.value })
                    }
                    placeholder="Ingresa tu API key de WhatsApp"
                  />
                </div>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <Key className="w-4 h-4" />
                  <span className="text-sm">
                    La API de WhatsApp requiere configuración adicional en Meta Business Suite
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Configuración de Email (SMTP)
                </CardTitle>
                <CardDescription>
                  Configura el servidor de correo saliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="emailSmtp">Servidor SMTP</Label>
                    <Input
                      id="emailSmtp"
                      value={integrationSettings.emailSmtp}
                      onChange={(e) =>
                        setIntegrationSettings({ ...integrationSettings, emailSmtp: e.target.value })
                      }
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emailPort">Puerto</Label>
                    <Input
                      id="emailPort"
                      value={integrationSettings.emailPort}
                      onChange={(e) =>
                        setIntegrationSettings({ ...integrationSettings, emailPort: e.target.value })
                      }
                      placeholder="587"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emailUser">Usuario</Label>
                    <Input
                      id="emailUser"
                      value={integrationSettings.emailUser}
                      onChange={(e) =>
                        setIntegrationSettings({ ...integrationSettings, emailUser: e.target.value })
                      }
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emailPassword">Contraseña</Label>
                    <Input
                      id="emailPassword"
                      type="password"
                      value={integrationSettings.emailPassword}
                      onChange={(e) =>
                        setIntegrationSettings({ ...integrationSettings, emailPassword: e.target.value })
                      }
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  APIs Externas
                </CardTitle>
                <CardDescription>
                  Otras integraciones disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Google Calendar</div>
                        <div className="text-sm text-gray-500">Sincronización de eventos</div>
                      </div>
                      <Button variant="outline" size="sm">Conectar</Button>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Zapier</div>
                        <div className="text-sm text-gray-500">Automatizaciones</div>
                      </div>
                      <Button variant="outline" size="sm">Conectar</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveIntegrations}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Cambios
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppLayout>
          <SettingsContent />
        </AppLayout>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
