# Guía de Despliegue - CRM Casas Confortables

## Archivo ZIP
El archivo `crm-casas-confortables-final.zip` (1.9 MB) contiene todo el código fuente del CRM listo para desplegar.

---

## Opción 1: Vercel (Recomendado - Más Fácil)

### Pasos:

1. **Crear cuenta en Vercel**
   - Ve a https://vercel.com
   - Regístrate con tu cuenta de GitHub, GitLab o Bitbucket

2. **Subir el código a GitHub**
   - Crea un repositorio nuevo en GitHub
   - Descomprime el ZIP en tu ordenador
   - Sube todos los archivos al repositorio:
   ```bash
   git init
   git add .
   git commit -m "CRM Casas Confortables"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/crm-casas-confortables.git
   git push -u origin main
   ```

3. **Desplegar en Vercel**
   - En Vercel, pulsa "New Project"
   - Importa tu repositorio de GitHub
   - Configura:
     - **Framework Preset**: Next.js
     - **Root Directory**: ./
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`
   - Pulsa "Deploy"

4. **Configurar variables de entorno en Vercel**
   - Ve a Settings → Environment Variables
   - Añade:
   ```
   NEXTAUTH_SECRET=tu-clave-secreta-muy-larga-y-segura
   NEXTAUTH_URL=https://tu-proyecto.vercel.app
   DATABASE_URL=file:./prisma/prod.db
   ```
   - Redespliega el proyecto

---

## Opción 2: Tu Propio Servidor (VPS/Dedicado)

### Requisitos previos:
- Servidor Linux (Ubuntu 20.04+ recomendado)
- Node.js 18+ instalado
- Puerto 3000 disponible (o el que configures)

### Pasos:

1. **Subir archivos al servidor**
   ```bash
   # Desde tu ordenador
   scp crm-casas-confortables-final.zip usuario@tu-servidor:/var/www/
   
   # En el servidor
   cd /var/www/
   unzip crm-casas-confortables-final.zip -d crm
   cd crm
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   nano .env
   ```
   
   Contenido:
   ```
   NEXTAUTH_SECRET=genera-una-clave-secreta-larga
   NEXTAUTH_URL=https://tudominio.com/crm
   DATABASE_URL=file:./prisma/production.db
   NODE_ENV=production
   ```

4. **Inicializar base de datos**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Compilar y ejecutar**
   ```bash
   npm run build
   npm run start
   ```

6. **Configurar como servicio (PM2)**
   ```bash
   npm install -g pm2
   pm2 start npm --name "crm" -- start
   pm2 save
   pm2 startup
   ```

---

## Opción 3: cPanel / Hosting Compartido

### Requisitos:
- Hosting con soporte Node.js
- Acceso SSH o terminal
- Node.js 18+ disponible

### Pasos:

1. **Subir archivos**
   - Accede al administrador de archivos de cPanel
   - Crea carpeta `crm` en tu directorio home
   - Sube y descomprime el ZIP

2. **Configurar aplicación Node.js**
   - En cPanel, busca "Setup Node.js App"
   - Crea nueva aplicación:
     - **Node.js version**: 18.x o superior
     - **Application mode**: Production
     - **Application root**: `/home/tuusuario/crm`
     - **Application URL**: tu dominio + /crm
     - **Application startup file**: server.js (dejar vacío, usa npm)

3. **Instalar dependencias**
   - Abre la terminal de cPanel
   ```bash
   cd ~/crm
   npm install --production
   npx prisma generate
   npx prisma db push
   npm run build
   ```

4. **Variables de entorno**
   - En cPanel, añade las variables de entorno:
   ```
   NEXTAUTH_SECRET=tu-clave-secreta
   NEXTAUTH_URL=https://tudominio.com/crm
   DATABASE_URL=file:./prisma/production.db
   ```

---

## Opción 4: Docker

### Crear Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Construir y ejecutar:
```bash
docker build -t crm-casas-confortables .
docker run -p 3000:3000 \
  -e NEXTAUTH_SECRET=tu-clave \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e DATABASE_URL=file:./prisma/prod.db \
  crm-casas-confortables
```

---

## Configuración Importante

### Credenciales por defecto:
- **Email**: admin@casasconfortables.com
- **Contraseña**: admin123
- ⚠️ **IMPORTANTE**: Cambia estas credenciales después del primer inicio

### Generar clave NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### URL base (basePath):
El CRM está configurado para funcionar en `/crm`. Si lo quieres en la raíz:
1. Edita `next.config.ts`
2. Elimina o comenta: `basePath: '/crm'`
3. Reconstruye el proyecto

---

## Estructura del Proyecto

```
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── seed.ts            # Datos iniciales
├── src/
│   ├── app/               # Páginas (Next.js App Router)
│   ├── components/        # Componentes React
│   ├── lib/               # Utilidades y servicios
│   └── hooks/             # Custom hooks
├── public/                # Archivos estáticos
└── package.json           # Dependencias
```

---

## Funcionalidades del CRM

- ✅ Dashboard principal
- ✅ Gestión de leads (pipeline de ventas)
- ✅ Obras y proyectos
- ✅ Subcontratistas (portal, tareas, pagos)
- ✅ Clientes
- ✅ Empresas/Compañías
- ✅ Catálogo de materiales
- ✅ Pedidos de materiales
- ✅ Catálogo de merchandising
- ✅ Presupuestos de subcontratistas
- ✅ Certificaciones de empleados
- ✅ Participación de beneficios (profit share)
- ✅ Contratos
- ✅ Biblioteca de documentos
- ✅ Análisis de documentos con IA
- ✅ Asistente IA integrado
- ✅ Gamificación
- ✅ Enlaces externos (calculadoras)
- ✅ Sistema de roles y permisos

---

## Soporte

Si tienes problemas durante el despliegue:
1. Revisa los logs del servidor
2. Verifica las variables de entorno
3. Asegúrate de que Node.js sea versión 18+
4. Comprueba que la base de datos se haya inicializado correctamente

---

**¡Buena suerte con tu CRM!** 🏠
