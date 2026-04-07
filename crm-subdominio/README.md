# CRM Casas Confortables

Sistema de gestión para constructora.

## Credenciales por defecto

- **Email:** admin@casasconfortables.com
- **Contraseña:** admin123

## Despliegue en Vercel

1. Subir este repositorio a GitHub
2. En Vercel, importar el repositorio
3. Añadir variables de entorno:
   - `NEXTAUTH_SECRET`: (generar con `openssl rand -base64 32`)
   - `DATABASE_URL`: `file:./prisma/prod.db`

## Configuración de subdominio

En tu proveedor de dominio (Nominalia), añadir registro DNS:

- **Tipo:** CNAME
- **Nombre:** crm
- **Valor:** cname.vercel-dns.com
