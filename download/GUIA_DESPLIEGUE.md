# 🚀 Guía de Despliegue - CRM Casas Confortables

## Opción 1: Vercel (Recomendado - Más Fácil)

### Paso 1: Preparar el proyecto para Vercel

El proyecto ya está configurado con `output: "standalone"` en `next.config.ts`.

### Paso 2: Crear cuenta en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con tu cuenta de GitHub, GitLab o Bitbucket

### Paso 3: Conectar el dominio

1. **Sube el código a un repositorio de Git**
   ```bash
   git init
   git add .
   git commit -m "CRM Casas Confortables"
   git remote add origin https://github.com/TU_USUARIO/casas-confortables-crm.git
   git push -u origin main
   ```

2. **Importa el proyecto en Vercel**
   - En Vercel Dashboard, haz clic en "Add New Project"
   - Selecciona tu repositorio
   - Configura las variables de entorno

3. **Configura el dominio**
   - Ve a Project Settings > Domains
   - Añade: `www.casasconfortables.com`
   - Sigue las instrucciones para configurar los DNS

### Paso 4: Configurar DNS en tu proveedor de dominio

En el panel de tu proveedor de dominio (GoDaddy, Namecheap, etc.):

```
Tipo: A
Nombre: @
Valor: 76.76.21.21

Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
```

### Paso 5: Variables de entorno en Vercel

Añade estas variables en Project Settings > Environment Variables:

```
DATABASE_URL=postgresql://usuario:password@host:5432/casas_confortables
NEXTAUTH_SECRET=tu-secreto-muy-largo-y-seguro
NEXTAUTH_URL=https://www.casasconfortables.com
```

**Importante:** SQLite no funciona en Vercel. Necesitas PostgreSQL.

### Paso 6: Migrar a PostgreSQL

1. **Crear base de datos PostgreSQL**
   - Usa [Neon](https://neon.tech) (gratis) o [Supabase](https://supabase.com)
   - Obtén la URL de conexión

2. **Actualizar schema.prisma**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Ejecutar migración**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## Opción 2: VPS/Servidor Dedicado

### Paso 1: Contratar un VPS

Proveedores recomendados:
- [DigitalOcean](https://digitalocean.com) - $6/mes
- [Hetzner](https://hetzner.com) - €4/mes
- [OVH](https://ovh.com) - desde €3/mes

### Paso 2: Configurar el servidor

```bash
# Conectar por SSH
ssh root@tu-ip-del-servidor

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PM2 (gestor de procesos)
npm install -g pm2

# Instalar Nginx
apt install -y nginx

# Instalar certbot para SSL
apt install -y certbot python3-certbot-nginx
```

### Paso 3: Subir el proyecto

```bash
# En tu ordenador local
scp -r /home/z/my-project root@tu-ip:/var/www/casas-confortables

# O usar Git
cd /var/www
git clone https://github.com/TU_USUARIO/casas-confortables-crm.git casas-confortables
```

### Paso 4: Configurar la aplicación

```bash
cd /var/www/casas-confortables

# Instalar dependencias
npm install

# Construir
npm run build

# Configurar base de datos
npx prisma generate
npx prisma db push
npx prisma db seed

# Crear archivo .env
cat > .env << EOF
DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://www.casasconfortables.com
EOF
```

### Paso 5: Configurar PM2

```bash
# Crear ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'casas-confortables',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/casas-confortables',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Iniciar
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Iniciar en boot
pm2 startup
```

### Paso 6: Configurar Nginx

```bash
# Crear configuración
cat > /etc/nginx/sites-available/casas-confortables << 'EOF'
server {
    listen 80;
    server_name casasconfortables.com www.casasconfortables.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Activar sitio
ln -s /etc/nginx/sites-available/casas-confortables /etc/nginx/sites-enabled/

# Testear configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### Paso 7: Configurar SSL (HTTPS)

```bash
# Obtener certificado SSL gratuito
certbot --nginx -d casasconfortables.com -d www.casasconfortables.com

# Renovación automática
certbot renew --dry-run
```

### Paso 8: Configurar DNS

En tu proveedor de dominio:

```
Tipo: A
Nombre: @
Valor: IP-DE-TU-SERVIDOR

Tipo: A
Nombre: www
Valor: IP-DE-TU-SERVIDOR
```

---

## Opción 3: Railway (Sencillo y Escalable)

### Paso 1: Crear cuenta
1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub

### Paso 2: Desplegar
1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Elige tu repositorio
4. Railway detectará automáticamente Next.js

### Paso 3: Añadir PostgreSQL
1. En tu proyecto, haz clic en "Add Service"
2. Selecciona "Database" > "PostgreSQL"
3. Railway creará la base de datos y añadirá la URL automáticamente

### Paso 4: Configurar variables
```
NEXTAUTH_SECRET=tu-secreto
NEXTAUTH_URL=https://tu-proyecto.railway.app
```

### Paso 5: Dominio personalizado
1. Ve a Settings > Domains
2. Añade `www.casasconfortables.com`
3. Configura los DNS según las instrucciones

---

## 📋 Checklist Final

- [ ] Dominio apuntando al servidor/hosting
- [ ] SSL configurado (HTTPS)
- [ ] Base de datos funcionando
- [ ] Variables de entorno configuradas
- [ ] Aplicación arrancando correctamente
- [ ] Login funcional
- [ ] Asistente AI funcionando

---

## 🔧 Mantenimiento

### Actualizar la aplicación
```bash
cd /var/www/casas-confortables
git pull
npm install
npm run build
pm2 restart casas-confortables
```

### Ver logs
```bash
pm2 logs casas-confortables
```

### Backup de base de datos
```bash
# SQLite
cp /var/www/casas-confortables/db/custom.db /backup/custom-$(date +%Y%m%d).db

# PostgreSQL
pg_dump -U usuario casas_confortables > backup.sql
```

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs: `pm2 logs`
2. Verifica Nginx: `nginx -t`
3. Comprueba el firewall: `ufw status`
4. Verifica DNS: `nslookup www.casasconfortables.com`
