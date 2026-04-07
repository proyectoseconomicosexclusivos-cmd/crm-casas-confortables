from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.lib.units import cm, inch
import os

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Create document
doc = SimpleDocTemplate(
    "/home/z/my-project/download/GUIA_DESPLIEGUE_CRM_CASAS_CONFORTABLES.pdf",
    pagesize=A4,
    title="Guia de Despliegue CRM Casas Confortables",
    author='Z.ai',
    creator='Z.ai',
    subject='Guia completa para desplegar el CRM en www.casasconfortables.com/crm'
)

# Styles
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'TitleStyle',
    fontName='Microsoft YaHei',
    fontSize=28,
    leading=36,
    alignment=TA_CENTER,
    spaceAfter=20,
    textColor=colors.HexColor('#1F4E79')
)

subtitle_style = ParagraphStyle(
    'SubtitleStyle',
    fontName='SimHei',
    fontSize=16,
    leading=22,
    alignment=TA_CENTER,
    spaceAfter=30,
    textColor=colors.HexColor('#666666')
)

h1_style = ParagraphStyle(
    'H1Style',
    fontName='Microsoft YaHei',
    fontSize=18,
    leading=26,
    alignment=TA_LEFT,
    spaceBefore=20,
    spaceAfter=12,
    textColor=colors.HexColor('#1F4E79')
)

h2_style = ParagraphStyle(
    'H2Style',
    fontName='Microsoft YaHei',
    fontSize=14,
    leading=20,
    alignment=TA_LEFT,
    spaceBefore=15,
    spaceAfter=8,
    textColor=colors.HexColor('#2E75B6')
)

h3_style = ParagraphStyle(
    'H3Style',
    fontName='SimHei',
    fontSize=12,
    leading=18,
    alignment=TA_LEFT,
    spaceBefore=10,
    spaceAfter=6,
    textColor=colors.HexColor('#404040')
)

body_style = ParagraphStyle(
    'BodyStyle',
    fontName='SimHei',
    fontSize=10.5,
    leading=18,
    alignment=TA_LEFT,
    spaceAfter=8,
    wordWrap='CJK'
)

code_style = ParagraphStyle(
    'CodeStyle',
    fontName='DejaVuSans',
    fontSize=9,
    leading=14,
    alignment=TA_LEFT,
    spaceAfter=8,
    backColor=colors.HexColor('#F5F5F5'),
    leftIndent=10,
    rightIndent=10,
    borderPadding=8
)

note_style = ParagraphStyle(
    'NoteStyle',
    fontName='SimHei',
    fontSize=10,
    leading=16,
    alignment=TA_LEFT,
    spaceAfter=8,
    backColor=colors.HexColor('#FFF8DC'),
    leftIndent=10,
    rightIndent=10,
    borderPadding=10,
    borderColor=colors.HexColor('#FFD700'),
    borderWidth=1,
    wordWrap='CJK'
)

# Build story
story = []

# Cover
story.append(Spacer(1, 3*cm))
story.append(Paragraph("GUIA DE DESPLIEGUE", title_style))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("CRM Casas Confortables", title_style))
story.append(Spacer(1, 1*cm))
story.append(Paragraph("Sistema completo de gestion para empresas de construccion", subtitle_style))
story.append(Spacer(1, 2*cm))
story.append(Paragraph("Despliegue en www.casasconfortables.com/crm", subtitle_style))
story.append(Spacer(1, 3*cm))
story.append(Paragraph("Version 1.0 - Abril 2025", subtitle_style))
story.append(Paragraph("Desarrollado con Next.js 16, React 19, Prisma y TypeScript", subtitle_style))

story.append(PageBreak())

# Table of contents
story.append(Paragraph("<b>INDICE</b>", h1_style))
story.append(Spacer(1, 0.5*cm))

toc_items = [
    ("1. Introduccion y requisitos previos", "3"),
    ("2. Opcion A: Despliegue en Vercel (Recomendado)", "4"),
    ("3. Opcion B: Despliegue en servidor propio", "8"),
    ("4. Configuracion del dominio", "11"),
    ("5. Configuracion de base de datos", "12"),
    ("6. Asistente IA integrado", "14"),
    ("7. Solucion de problemas", "15"),
    ("8. Contacto y soporte", "16"),
]

toc_data = []
for item, page in toc_items:
    toc_data.append([
        Paragraph(item, body_style),
        Paragraph(page, ParagraphStyle('TOCPage', fontName='Times New Roman', fontSize=10.5, alignment=TA_CENTER))
    ])

toc_table = Table(toc_data, colWidths=[14*cm, 2*cm])
toc_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
]))
story.append(toc_table)

story.append(PageBreak())

# Section 1
story.append(Paragraph("<b>1. INTRODUCCION Y REQUISITOS PREVIOS</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Esta guia te permitira desplegar el sistema CRM de Casas Confortables en tu dominio "
    "www.casasconfortables.com/crm. El sistema incluye un asistente de IA integrado que te "
    "ayudara a resolver errores, mejorar la aplicacion y realizar tareas administrativas.",
    body_style
))

story.append(Paragraph("<b>1.1 Que incluye el sistema</b>", h2_style))
story.append(Paragraph(
    "El CRM de Casas Confortables es un sistema completo de gestion empresarial disenado "
    "especificamente para empresas de construccion. Incluye modulos para gestion de leads "
    "con pipeline Kanban, seguimiento de obras y proyectos, modulo de produccion para fabrica, "
    "portal de subcontratistas con validacion de trabajos, control de pagos por fases, "
    "sistema de comisiones automaticas, gamificacion para empleados, y un asistente de IA "
    "integrado para el administrador.",
    body_style
))

story.append(Paragraph("<b>1.2 Requisitos previos</b>", h2_style))
story.append(Paragraph(
    "Antes de comenzar el despliegue, necesitaras tener acceso al dominio "
    "www.casasconfortables.com con capacidad para modificar registros DNS. Tambien "
    "necesitaras una cuenta en Vercel (gratuita) o acceso a un servidor VPS/Cloud con Node.js 18+. "
    "Para la base de datos, se recomienda PostgreSQL pero puedes usar SQLite para desarrollo "
    "o MySQL si lo prefieres.",
    body_style
))

story.append(Paragraph("<b>1.3 Tecnologias utilizadas</b>", h2_style))
story.append(Paragraph(
    "El sistema esta construido con tecnologias modernas y estables: Next.js 16 como framework "
    "de aplicacion, React 19 para la interfaz de usuario, TypeScript para tipo seguro, "
    "Prisma como ORM para base de datos, NextAuth.js para autenticacion, Tailwind CSS para "
    "estilos, y shadcn/ui para componentes de interfaz.",
    body_style
))

story.append(PageBreak())

# Section 2
story.append(Paragraph("<b>2. OPCION A: DESPLIEGUE EN VERCEL (RECOMENDADO)</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Vercel es la plataforma mas sencilla para desplegar aplicaciones Next.js. Ofrece "
    "despliegue automatico desde GitHub, SSL gratuito, CDN global, y escalado automatico. "
    "El plan gratuito es suficiente para la mayoria de empresas.",
    body_style
))

story.append(Paragraph("<b>Paso 1: Crear cuenta en Vercel</b>", h2_style))
story.append(Paragraph(
    "Ve a vercel.com y crea una cuenta gratuita. Puedes registrarte directamente con tu "
    "cuenta de GitHub, lo que facilitara la conexion con tu repositorio. Una vez creada "
    "la cuenta, verifica tu email para activar todas las funcionalidades.",
    body_style
))

story.append(Paragraph("<b>Paso 2: Subir el codigo a GitHub</b>", h2_style))
story.append(Paragraph(
    "Si aun no tienes el codigo en un repositorio de GitHub, sigue estos pasos. Primero, "
    "crea un nuevo repositorio en github.com. Luego, descomprime el archivo ZIP del CRM "
    "en tu ordenador. Abre una terminal en la carpeta del proyecto y ejecuta los siguientes "
    "comandos:",
    body_style
))

story.append(Paragraph(
    "git init<br/>"
    "git add .<br/>"
    "git commit -m \"CRM Casas Confortables\"<br/>"
    "git branch -M main<br/>"
    "git remote add origin https://github.com/TU_USUARIO/crm-casas-confortables.git<br/>"
    "git push -u origin main",
    code_style
))

story.append(Paragraph("<b>Paso 3: Importar proyecto en Vercel</b>", h2_style))
story.append(Paragraph(
    "En el dashboard de Vercel, haz clic en \"Add New...\" y selecciona \"Project\". "
    "Conecta tu cuenta de GitHub si aun no lo has hecho. Selecciona el repositorio "
    "crm-casas-confortables de la lista. Vercel detectara automaticamente que es un "
    "proyecto Next.js y configurara los ajustes de construccion.",
    body_style
))

story.append(Paragraph("<b>Paso 4: Configurar variables de entorno</b>", h2_style))
story.append(Paragraph(
    "Antes de hacer el despliegue, debes configurar las variables de entorno. En la "
    "pagina de configuracion del proyecto en Vercel, ve a \"Environment Variables\" y "
    "anade las siguientes variables:",
    body_style
))

env_data = [
    [Paragraph('<b>Variable</b>', ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white)),
     Paragraph('<b>Valor</b>', ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white)),
     Paragraph('<b>Descripcion</b>', ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white))],
    [Paragraph('NEXT_PUBLIC_BASE_PATH', body_style),
     Paragraph('/crm', body_style),
     Paragraph('Ruta base para el CRM', body_style)],
    [Paragraph('DATABASE_URL', body_style),
     Paragraph('postgresql://...', body_style),
     Paragraph('URL de conexion a PostgreSQL', body_style)],
    [Paragraph('NEXTAUTH_SECRET', body_style),
     Paragraph('clave-secreta-32-chars', body_style),
     Paragraph('Clave secreta para sesiones', body_style)],
    [Paragraph('NEXTAUTH_URL', body_style),
     Paragraph('https://www.casasconfortables.com/crm', body_style),
     Paragraph('URL completa del CRM', body_style)],
]

env_table = Table(env_data, colWidths=[4.5*cm, 5*cm, 6*cm])
env_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(env_table)
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "IMPORTANTE: Para generar NEXTAUTH_SECRET, puedes usar el comando: openssl rand -base64 32",
    note_style
))

story.append(Paragraph("<b>Paso 5: Desplegar</b>", h2_style))
story.append(Paragraph(
    "Haz clic en \"Deploy\" y espera a que Vercel construya y despliegue tu aplicacion. "
    "El proceso tardara aproximadamente 2-3 minutos. Una vez completado, veras una pantalla "
    "de confirmacion con la URL de tu despliegue (algo como crm-casas-confortables.vercel.app).",
    body_style
))

story.append(Paragraph("<b>Paso 6: Configurar dominio personalizado</b>", h2_style))
story.append(Paragraph(
    "Para usar tu dominio www.casasconfortables.com, ve a \"Settings\" > \"Domains\" en tu "
    "proyecto de Vercel. Anade el dominio www.casasconfortables.com. Vercel te mostrara "
    "los registros DNS que debes configurar en tu proveedor de dominio.",
    body_style
))

story.append(PageBreak())

# Section 3
story.append(Paragraph("<b>3. OPCION B: DESPLIEGUE EN SERVIDOR PROPIO</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Si prefieres tener el control total del servidor, puedes desplegar en un VPS o servidor "
    "dedicado. Esta opcion requiere mas conocimientos tecnicos pero te da mayor control sobre "
    "la infraestructura.",
    body_style
))

story.append(Paragraph("<b>Requisitos del servidor</b>", h2_style))
story.append(Paragraph(
    "El servidor debe tener minimo 2GB de RAM y 20GB de almacenamiento. Se recomienda Ubuntu "
    "22.04 LTS como sistema operativo. Necesitaras Node.js 18+, PostgreSQL 14+, y Nginx como "
    "proxy inverso.",
    body_style
))

story.append(Paragraph("<b>Paso 1: Preparar el servidor</b>", h2_style))
story.append(Paragraph(
    "Conectate a tu servidor por SSH y ejecuta los siguientes comandos para instalar las "
    "dependencias necesarias:",
    body_style
))

story.append(Paragraph(
    "# Actualizar sistema<br/>"
    "sudo apt update && sudo apt upgrade -y<br/><br/>"
    "# Instalar Node.js 20<br/>"
    "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -<br/>"
    "sudo apt install -y nodejs<br/><br/>"
    "# Instalar PostgreSQL<br/>"
    "sudo apt install -y postgresql postgresql-contrib<br/><br/>"
    "# Instalar Nginx<br/>"
    "sudo apt install -y nginx",
    code_style
))

story.append(Paragraph("<b>Paso 2: Configurar PostgreSQL</b>", h2_style))
story.append(Paragraph(
    "Crea una base de datos y usuario para el CRM:",
    body_style
))

story.append(Paragraph(
    "sudo -u postgres psql<br/>"
    "CREATE DATABASE casas_confortables;<br/>"
    "CREATE USER crm_user WITH PASSWORD 'tu_password_seguro';<br/>"
    "GRANT ALL PRIVILEGES ON DATABASE casas_confortables TO crm_user;<br/>"
    "\\q",
    code_style
))

story.append(Paragraph("<b>Paso 3: Subir el proyecto</b>", h2_style))
story.append(Paragraph(
    "Sube los archivos del CRM al servidor, ya sea por SCP, SFTP o clonando desde GitHub. "
    "Se recomienda usar /var/www/crm como directorio del proyecto.",
    body_style
))

story.append(Paragraph("<b>Paso 4: Configurar variables de entorno</b>", h2_style))
story.append(Paragraph(
    "Crea el archivo .env.production en el directorio del proyecto:",
    body_style
))

story.append(Paragraph(
    "NEXT_PUBLIC_BASE_PATH=/crm<br/>"
    "DATABASE_URL=\"postgresql://crm_user:tu_password@localhost:5432/casas_confortables\"<br/>"
    "NEXTAUTH_SECRET=\"tu-clave-secreta-32-caracteres\"<br/>"
    "NEXTAUTH_URL=\"https://www.casasconfortables.com/crm\"",
    code_style
))

story.append(Paragraph("<b>Paso 5: Construir y ejecutar</b>", h2_style))
story.append(Paragraph(
    "Instala las dependencias, genera el cliente de Prisma, y construye la aplicacion:",
    body_style
))

story.append(Paragraph(
    "cd /var/www/crm<br/>"
    "npm install<br/>"
    "npx prisma generate<br/>"
    "npx prisma migrate deploy<br/>"
    "npm run build",
    code_style
))

story.append(Paragraph("<b>Paso 6: Configurar PM2</b>", h2_style))
story.append(Paragraph(
    "PM2 es un gestor de procesos que mantendra tu aplicacion ejecutandose. Instalalo y "
    "configura el inicio automatico:",
    body_style
))

story.append(Paragraph(
    "sudo npm install -g pm2<br/>"
    "pm2 start npm --name \"crm\" -- start<br/>"
    "pm2 startup<br/>"
    "pm2 save",
    code_style
))

story.append(Paragraph("<b>Paso 7: Configurar Nginx</b>", h2_style))
story.append(Paragraph(
    "Crea la configuracion de Nginx para servir el CRM:",
    body_style
))

story.append(Paragraph(
    "server {<br/>"
    "    listen 80;<br/>"
    "    server_name www.casasconfortables.com;<br/><br/>"
    "    location /crm {<br/>"
    "        proxy_pass http://localhost:3000;<br/>"
    "        proxy_http_version 1.1;<br/>"
    "        proxy_set_header Upgrade $http_upgrade;<br/>"
    "        proxy_set_header Connection 'upgrade';<br/>"
    "        proxy_set_header Host $host;<br/>"
    "        proxy_cache_bypass $http_upgrade;<br/>"
    "    }<br/>"
    "}",
    code_style
))

story.append(PageBreak())

# Section 4
story.append(Paragraph("<b>4. CONFIGURACION DEL DOMINIO</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Independientemente de la opcion de despliegue elegida, necesitaras configurar tu dominio "
    "para que apunte al servidor correcto. Esta configuracion se realiza en el panel de control "
    "de tu proveedor de dominio (GoDaddy, Namecheap, etc.).",
    body_style
))

story.append(Paragraph("<b>4.1 Configuracion DNS para Vercel</b>", h2_style))
story.append(Paragraph(
    "Si usas Vercel, necesitaras configurar los siguientes registros DNS:",
    body_style
))

dns_data = [
    [Paragraph('<b>Tipo</b>', ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white)),
     Paragraph('<b>Nombre</b>', ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white)),
     Paragraph('<b>Valor</b>', ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white))],
    [Paragraph('A', body_style),
     Paragraph('www', body_style),
     Paragraph('76.76.21.21', body_style)],
    [Paragraph('CNAME', body_style),
     Paragraph('@', body_style),
     Paragraph('cname.vercel-dns.com', body_style)],
]

dns_table = Table(dns_data, colWidths=[3*cm, 4*cm, 8*cm])
dns_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(dns_table)
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Los cambios DNS pueden tardar hasta 48 horas en propagarse, aunque normalmente "
    "se aplican en 1-2 horas.",
    note_style
))

story.append(Paragraph("<b>4.2 Configurar SSL/HTTPS</b>", h2_style))
story.append(Paragraph(
    "La seguridad es fundamental para proteger los datos de tu empresa. Vercel incluye SSL "
    "automatico y gratuito mediante Let's Encrypt. Si usas servidor propio, puedes instalar "
    "Certbot para obtener certificados SSL gratuitos con el comando: sudo certbot --nginx -d "
    "www.casasconfortables.com",
    body_style
))

story.append(PageBreak())

# Section 5
story.append(Paragraph("<b>5. CONFIGURACION DE BASE DE DATOS</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "La base de datos es el corazon de tu CRM. Almacena toda la informacion de leads, clientes, "
    "obras, subcontratistas y mas. Una configuracion correcta es esencial para el rendimiento "
    "y la seguridad del sistema.",
    body_style
))

story.append(Paragraph("<b>5.1 Opciones de base de datos</b>", h2_style))

db_options = [
    [Paragraph('<b>Base de datos</b>', ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white)),
     Paragraph('<b>Ventajas</b>', ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white)),
     Paragraph('<b>Recomendado para</b>', ParagraphStyle('TableHeader', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white))],
    [Paragraph('PostgreSQL', body_style),
     Paragraph('Mayor rendimiento, mejor escalabilidad, mas caracteristicas', body_style),
     Paragraph('Produccion (recomendado)', body_style)],
    [Paragraph('MySQL', body_style),
     Paragraph('Ampliamente soportado, buena documentacion', body_style),
     Paragraph('Alternativa a PostgreSQL', body_style)],
    [Paragraph('SQLite', body_style),
     Paragraph('Sin configuracion, archivo unico, portatil', body_style),
     Paragraph('Desarrollo y pruebas', body_style)],
]

db_table = Table(db_options, colWidths=[3.5*cm, 7*cm, 4.5*cm])
db_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(db_table)
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>5.2 Inicializar la base de datos</b>", h2_style))
story.append(Paragraph(
    "Una vez configurada la conexion, ejecuta las migraciones para crear todas las tablas "
    "necesarias. El sistema utiliza Prisma como ORM, lo que garantiza que la estructura de "
    "la base de datos este correctamente definida:",
    body_style
))

story.append(Paragraph(
    "# Generar cliente Prisma<br/>"
    "npx prisma generate<br/><br/>"
    "# Aplicar migraciones (crear tablas)<br/>"
    "npx prisma migrate deploy<br/><br/>"
    "# Opcional: Cargar datos iniciales<br/>"
    "npx prisma db seed",
    code_style
))

story.append(Paragraph("<b>5.3 Copias de seguridad</b>", h2_style))
story.append(Paragraph(
    "Es fundamental configurar copias de seguridad automaticas. Para PostgreSQL, puedes "
    "usar pg_dump para crear backups diarios. Se recomienda almacenar las copias de seguridad "
    "en una ubicacion diferente al servidor principal, como Amazon S3 o Google Cloud Storage.",
    body_style
))

story.append(PageBreak())

# Section 6
story.append(Paragraph("<b>6. ASISTENTE IA INTEGRADO</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "El CRM incluye un asistente de IA integrado que te ayudara con las tareas diarias, "
    "resolucion de errores y mejoras del sistema. Este asistente esta disponible exclusivamente "
    "para usuarios administradores y se accede mediante el icono de estrellas en la barra "
    "superior de navegacion.",
    body_style
))

story.append(Paragraph("<b>6.1 Funcionalidades del asistente</b>", h2_style))
story.append(Paragraph(
    "El asistente de IA puede ayudarte en multiples aspectos de la gestion del CRM. "
    "Puede resolver dudas sobre el funcionamiento de cualquier modulo del sistema, "
    "ayudarte a diagnosticar y corregir errores que puedan surgir, sugerir mejoras "
    "y nuevas funcionalidades para tu negocio, explicar el flujo de trabajo de leads "
    "y obras, proporcionar informacion sobre clientes y proyectos, y asistir en tareas "
    "de configuracion del sistema.",
    body_style
))

story.append(Paragraph("<b>6.2 Como usar el asistente</b>", h2_style))
story.append(Paragraph(
    "Para acceder al asistente, haz clic en el icono de estrellas en la esquina superior "
    "derecha de la pantalla. Se abrira una interfaz de chat donde puedes escribir tus "
    "preguntas o solicitudes. El asistente recuerda el historial de conversacion, por lo "
    "que puedes mantener dialogos continuos sin repetir contexto.",
    body_style
))

story.append(Paragraph("<b>6.3 Ejemplos de uso</b>", h2_style))
story.append(Paragraph(
    "Algunos ejemplos de preguntas que puedes hacer al asistente incluyen: Como creo un "
    "nuevo lead en el sistema?, Explicame como funciona el modulo de subcontratas, "
    "Tengo un error al guardar un cliente, ayudame a solucionarlo, Que mejoras sugeririas "
    "para el flujo de trabajo de obras?, Como funcionan las comisiones automaticas?",
    body_style
))

story.append(PageBreak())

# Section 7
story.append(Paragraph("<b>7. SOLUCION DE PROBLEMAS</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "A continuacion se presentan soluciones a los problemas mas comunes que puedes "
    "encontrar durante el despliegue y uso del CRM.",
    body_style
))

story.append(Paragraph("<b>Problema: Error 500 en la aplicacion</b>", h3_style))
story.append(Paragraph(
    "Causa: Generalmente es un problema con la base de datos o las variables de entorno. "
    "Solucion: Verifica que DATABASE_URL esta correctamente configurada. Comprueba que "
    "la base de datos esta accesible. Revisa los logs del servidor para mas detalles.",
    body_style
))

story.append(Paragraph("<b>Problema: No puedo iniciar sesion</b>", h3_style))
story.append(Paragraph(
    "Causa: Credenciales incorrectas o usuario no creado. Solucion: Asegurate de haber "
    "ejecutado el seed de la base de datos. Las credenciales por defecto son "
    "admin@casasconfortables.com / admin123. Cambia esta contrasena despues del primer login.",
    body_style
))

story.append(Paragraph("<b>Problema: El asistente IA no responde</b>", h3_style))
story.append(Paragraph(
    "Causa: Problema con la conexion a la API de IA. Solucion: Verifica que el servidor "
    "tiene acceso a internet. Comprueba los logs de la aplicacion. El asistente utiliza "
    "el SDK de Z.ai que viene preconfigurado.",
    body_style
))

story.append(Paragraph("<b>Problema: Las paginas no cargan correctamente</b>", h3_style))
story.append(Paragraph(
    "Causa: Problema con el basePath o configuracion de rutas. Solucion: Verifica que "
    "NEXT_PUBLIC_BASE_PATH esta configurado como /crm. Asegurate de que NEXTAUTH_URL "
    "incluye la ruta completa /crm al final.",
    body_style
))

story.append(PageBreak())

# Section 8
story.append(Paragraph("<b>8. CONTACTO Y SOPORTE</b>", h1_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Si necesitas ayuda adicional con el despliegue o tienes preguntas sobre el sistema, "
    "puedes utilizar el asistente de IA integrado en el CRM. El asistente tiene acceso "
    "a toda la documentacion del sistema y puede guiarte paso a paso en cualquier proceso.",
    body_style
))

story.append(Paragraph("<b>8.1 Recursos adicionales</b>", h2_style))
story.append(Paragraph(
    "Documentacion de Next.js: nextjs.org/docs - Documentacion oficial del framework. "
    "Documentacion de Prisma: prisma.io/docs - Guia completa del ORM. Documentacion de "
    "Vercel: vercel.com/docs - Guia de despliegue y configuracion.",
    body_style
))

story.append(Paragraph("<b>8.2 Notas finales</b>", h2_style))
story.append(Paragraph(
    "Recuerda cambiar las contrasenas por defecto despues del primer inicio de sesion. "
    "Realiza copias de seguridad periodicas de la base de datos. Manten el sistema "
    "actualizado con las ultimas correcciones de seguridad. El asistente de IA esta "
    "disponible 24/7 para ayudarte con cualquier consulta.",
    body_style
))

story.append(Spacer(1, 1*cm))
story.append(Paragraph(
    "Este sistema ha sido desarrollado especificamente para Casas Confortables. "
    "Incluye todas las funcionalidades necesarias para la gestion integral de tu "
    "empresa de construccion.",
    note_style
))

# Build PDF
doc.build(story)
print("PDF generado correctamente")
