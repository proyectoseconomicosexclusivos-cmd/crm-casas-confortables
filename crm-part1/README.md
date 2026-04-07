# CRM SaaS - Casas Confortables

Sistema completo de gestión de clientes y leads para empresas de construcción, diseñado específicamente para **Casas Confortables**.

## 🏗️ Arquitectura

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: Next.js API Routes
- **Base de datos**: SQLite (Prisma ORM) - preparado para PostgreSQL
- **Autenticación**: NextAuth.js con roles jerárquicos
- **UI**: Tailwind CSS 4 + shadcn/ui
- **Estado**: Zustand + TanStack Query
- **Gráficos**: Recharts

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- Bun (recomendado) o npm

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd casas-confortables-crm

# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env

# Inicializar base de datos
bun run db:push

# Ejecutar seed (datos de ejemplo)
bun run prisma/seed.ts

# Iniciar servidor de desarrollo
bun run dev
```

### Credenciales de Demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Super Admin | admin@casasconfortables.com | admin123 |
| Team Leader | lider@casasconfortables.com | admin123 |
| Comercial | carlos@casasconfortables.com | admin123 |

## 📋 Funcionalidades

### ✅ Implementadas

- **Sistema de Autenticación**
  - Login con email/contraseña
  - Roles jerárquicos (9 tipos de usuario)
  - Sesiones JWT
  - Control de acceso por permisos

- **Gestión de Leads**
  - Pipeline Kanban con drag & drop
  - CRUD completo de leads
  - 7 estados de lead (Nuevo → Cerrado/Perdido)
  - Historial de actividades
  - Comentarios internos
  - Filtros y búsqueda

- **Dashboard**
  - KPIs principales (leads, conversión, valor)
  - Gráficos de tendencia
  - Distribución por tipo y fuente
  - Rendimiento por comercial

- **Estructura Organizativa**
  - Empresas (franquicias, inmobiliarias, subcontratas)
  - Oficinas
  - Equipos
  - Jerarquía de usuarios

- **API REST**
  - Endpoints documentados
  - Control de acceso por roles
  - Paginación y filtros

### 🔄 En Desarrollo

- Sistema de reparto automático de leads
- Generación de presupuestos PDF
- Gestión documental
- Módulo de obras
- Portal de subcontratas
- Notificaciones por email/WhatsApp

## 👥 Roles del Sistema

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| SUPER_ADMIN | Administrador principal | Acceso total |
| ADMIN | Administrador de empresa | Gestión empresa |
| TEAM_LEADER | Jefe de equipo | Gestión equipo |
| COMMERCIAL | Comercial | Sus leads |
| FRANCHISE | Franquiciado | Su franquicia |
| REAL_ESTATE | Inmobiliaria | Sus leads |
| SUBCONTRACTOR | Subcontrata | Obras asignadas |
| WORKER | Trabajador | Tareas asignadas |
| CLIENT | Cliente | Portal cliente |

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticación
│   │   ├── leads/         # CRUD leads
│   │   ├── users/         # CRUD usuarios
│   │   ├── companies/     # CRUD empresas
│   │   └── stats/         # Estadísticas
│   ├── login/             # Página de login
│   └── page.tsx           # Dashboard principal
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── layout/            # Layout principal
│   ├── dashboard/         # Componentes dashboard
│   └── leads/             # Componentes leads
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades
│   ├── auth.ts           # Configuración NextAuth
│   ├── permissions.ts    # Sistema de permisos
│   └── api-utils.ts      # Helpers API
├── types/                 # Tipos TypeScript
└── prisma/
    └── schema.prisma     # Schema base de datos
```

## 🔌 API Endpoints

### Autenticación
```
POST   /api/auth/signin     # Iniciar sesión
POST   /api/auth/signout    # Cerrar sesión
GET    /api/auth/session    # Obtener sesión
```

### Leads
```
GET    /api/leads           # Listar leads
POST   /api/leads           # Crear lead
GET    /api/leads/:id       # Obtener lead
PUT    /api/leads/:id       # Actualizar lead
DELETE /api/leads/:id       # Eliminar lead
```

### Usuarios
```
GET    /api/users           # Listar usuarios
POST   /api/users           # Crear usuario
GET    /api/users/:id       # Obtener usuario
PUT    /api/users/:id       # Actualizar usuario
```

### Estadísticas
```
GET    /api/stats           # Dashboard stats
```

## 🛡️ Seguridad

- Contraseñas encriptadas con bcrypt
- Sesiones JWT con expiración
- Control de acceso por roles (RBAC)
- Logs de actividad
- Protección CSRF
- Validación de datos con Zod

## 📊 Base de Datos

### Modelos principales

- **User**: Usuarios del sistema
- **Company**: Empresas (franquicias, subcontratas, etc.)
- **Office**: Oficinas
- **Team**: Equipos de trabajo
- **Lead**: Leads/prospectos
- **Work**: Obras
- **Document**: Documentos
- **Budget**: Presupuestos
- **Notification**: Notificaciones
- **ActivityLog**: Registro de actividad

## 🚀 Despliegue en Producción

### Preparación

1. Cambiar a PostgreSQL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/crm"
```

2. Configurar variables de producción:
```env
NODE_ENV=production
NEXTAUTH_URL=https://tudominio.com
NEXTAUTH_SECRET=tu-secreto-seguro
```

3. Generar cliente Prisma:
```bash
bun run db:generate
bun run db:migrate
```

### Plataformas recomendadas

- **Vercel** (recomendado para Next.js)
- **Railway** (base de datos + hosting)
- **AWS** (EC2 + RDS)
- **DigitalOcean** (App Platform)

### Docker

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "start"]
```

## 📈 Roadmap

### Fase 1 (Actual)
- [x] Autenticación y roles
- [x] Pipeline de leads
- [x] Dashboard básico
- [x] API REST

### Fase 2
- [ ] Reparto automático de leads
- [ ] Generación de PDFs
- [ ] Gestión documental
- [ ] Módulo de obras

### Fase 3
- [ ] Portal de subcontratas
- [ ] Notificaciones email
- [ ] Integración WhatsApp
- [ ] App móvil (PWA)

### Fase 4
- [ ] IA para predicción de cierre
- [ ] Recomendaciones automáticas
- [ ] Análisis avanzado
- [ ] Integraciones (ERP, contabilidad)

## 📝 Licencia

Privado - Casas Confortables © 2024

## 👨‍💻 Desarrollo

Este CRM ha sido desarrollado siguiendo las mejores prácticas de:
- Clean Architecture
- SOLID Principles
- TypeScript strict mode
- Responsive Design
- Accessibility (WCAG)

---

**Casas Confortables** - Construyendo hogares, creando confianza.
