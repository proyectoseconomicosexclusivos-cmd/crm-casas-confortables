from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))

registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Create document
pdf_path = '/home/z/my-project/download/GUIA_INSTALACION_PASO_A_PASO.pdf'
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    title='GUIA_INSTALACION_PASO_A_PASO',
    author='Z.ai',
    creator='Z.ai',
    subject='Guia de instalacion del CRM Casas Confortables'
)

# Styles
title_style = ParagraphStyle('Title', fontName='Microsoft YaHei', fontSize=28, leading=34, alignment=TA_CENTER, spaceAfter=20, textColor=colors.HexColor('#1F4E79'))
subtitle_style = ParagraphStyle('Subtitle', fontName='Microsoft YaHei', fontSize=16, leading=22, alignment=TA_CENTER, spaceAfter=30, textColor=colors.HexColor('#666666'))
h1_style = ParagraphStyle('H1', fontName='Microsoft YaHei', fontSize=18, leading=24, spaceBefore=20, spaceAfter=12, textColor=colors.HexColor('#1F4E79'))
h2_style = ParagraphStyle('H2', fontName='Microsoft YaHei', fontSize=14, leading=20, spaceBefore=15, spaceAfter=8, textColor=colors.HexColor('#2E75B6'))
body_style = ParagraphStyle('Body', fontName='SimHei', fontSize=11, leading=18, alignment=TA_LEFT, spaceAfter=10, wordWrap='CJK')
code_style = ParagraphStyle('Code', fontName='Times New Roman', fontSize=10, leading=14, alignment=TA_LEFT, backColor=colors.HexColor('#F5F5F5'), leftIndent=20, rightIndent=20, spaceBefore=5, spaceAfter=5)

# Table styles
th_style = ParagraphStyle('th', fontName='SimHei', fontSize=10, textColor=colors.white, alignment=TA_CENTER)
td_style = ParagraphStyle('td', fontName='SimHei', fontSize=10)
td_en_style = ParagraphStyle('td_en', fontName='Times New Roman', fontSize=10)

# Build content
story = []

# Cover
story.append(Spacer(1, 80))
story.append(Paragraph('<b>CRM CASAS CONFORTABLES</b>', title_style))
story.append(Paragraph('Guía de Instalación Paso a Paso', subtitle_style))
story.append(Spacer(1, 40))
story.append(Paragraph('Sistema completo de gestión para empresas de construcción', body_style))
story.append(Paragraph('Control de leads, obras, tareas, horas y análisis con IA', body_style))
story.append(Spacer(1, 60))
story.append(Paragraph('Versión: 2.0 | Fecha: Abril 2026', body_style))
story.append(PageBreak())

# Section 1
story.append(Paragraph('<b>1. REQUISITOS DEL SERVIDOR</b>', h1_style))
story.append(Paragraph('Antes de comenzar la instalación, asegúrese de que su servidor cumple con los siguientes requisitos mínimos para garantizar el correcto funcionamiento del sistema CRM.', body_style))

story.append(Paragraph('<b>1.1 Requisitos Mínimos</b>', h2_style))

req_data = [
    [Paragraph('<b>Componente</b>', th_style), Paragraph('<b>Requisito</b>', th_style), Paragraph('<b>Notas</b>', th_style)],
    [Paragraph('Node.js', td_style), Paragraph('v18.0 o superior', td_style), Paragraph('Recomendado v20 LTS', td_style)],
    [Paragraph('npm/pnpm', td_style), Paragraph('v9.0 o superior', td_style), Paragraph('Gestor de paquetes', td_style)],
    [Paragraph('Base de datos', td_style), Paragraph('PostgreSQL 14+ o SQLite', td_style), Paragraph('SQLite para desarrollo', td_style)],
    [Paragraph('RAM', td_style), Paragraph('Mínimo 512MB', td_style), Paragraph('1GB recomendado', td_style)],
    [Paragraph('Almacenamiento', td_style), Paragraph('500MB mínimo', td_style), Paragraph('Para archivos y BD', td_style)],
]

req_table = Table(req_data, colWidths=[4*cm, 5*cm, 5*cm])
req_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(Spacer(1, 10))
story.append(req_table)
story.append(Spacer(1, 20))

# Section 2
story.append(Paragraph('<b>2. DESCARGA DEL ARCHIVO</b>', h1_style))
story.append(Paragraph('El archivo ZIP del CRM completo se encuentra disponible en la carpeta de descargas. Este archivo contiene todo el código fuente, configuraciones y archivos necesarios.', body_style))
story.append(Paragraph('<b>2.1 Ubicación del archivo</b>', h2_style))
story.append(Paragraph('casas-confortables-crm-completo.zip (aproximadamente 2.5 MB)', code_style))

story.append(Paragraph('<b>2.2 Contenido del paquete</b>', h2_style))
story.append(Paragraph('El archivo ZIP incluye: código fuente completo de Next.js 16 con TypeScript, esquema de base de datos Prisma con 61 modelos, componentes de interfaz con shadcn/ui y Tailwind CSS, sistema de autenticación con NextAuth.js, API REST completa, sistema de IA integrado, módulos de control de tareas y horas para trabajadores, y sistema de roles jerárquicos con 9 niveles de acceso.', body_style))

# Section 3
story.append(Paragraph('<b>3. INSTALACIÓN PASO A PASO</b>', h1_style))

story.append(Paragraph('<b>Paso 1: Subir archivos al servidor</b>', h2_style))
story.append(Paragraph('Suba el archivo ZIP a la carpeta deseada (normalmente /var/www/ o public_html/) y descomprímalo:', body_style))
story.append(Paragraph('unzip casas-confortables-crm-completo.zip -d /var/www/crm', code_style))

story.append(Paragraph('<b>Paso 2: Instalar dependencias</b>', h2_style))
story.append(Paragraph('Navegue a la carpeta del proyecto y ejecute:', body_style))
story.append(Paragraph('cd /var/www/crm\nnpm install', code_style))

story.append(Paragraph('<b>Paso 3: Configurar variables de entorno</b>', h2_style))
story.append(Paragraph('Cree el archivo .env con la configuración:', body_style))
story.append(Paragraph('cp .env.example .env\nnano .env', code_style))
story.append(Paragraph('# Base de datos\nDATABASE_URL="postgresql://usuario:password@localhost:5432/crm_casas"\n\n# Seguridad\nNEXTAUTH_SECRET="generar-clave-secreta-aleatoria-de-32-caracteres"\nNEXTAUTH_URL="https://www.casasconfortables.com/crm"\n\n# Subdirectorio\nNEXT_PUBLIC_BASE_PATH="/crm"', code_style))

story.append(Paragraph('<b>Paso 4: Generar cliente Prisma y crear BD</b>', h2_style))
story.append(Paragraph('npx prisma generate\nnpx prisma db push', code_style))

story.append(Paragraph('<b>Paso 5: Construir la aplicación</b>', h2_style))
story.append(Paragraph('npm run build', code_style))

story.append(Paragraph('<b>Paso 6: Iniciar el servidor</b>', h2_style))
story.append(Paragraph('npm run start\n# O con PM2 para producción:\npm2 start npm --name "crm" -- run start', code_style))

# Section 4
story.append(Paragraph('<b>4. CREDENCIALES DE ACCESO</b>', h1_style))
story.append(Paragraph('El sistema incluye usuarios preconfigurados. Cambie las contraseñas después de la instalación.', body_style))

cred_data = [
    [Paragraph('<b>Rol</b>', th_style), Paragraph('<b>Email</b>', th_style), Paragraph('<b>Contraseña</b>', th_style), Paragraph('<b>Permisos</b>', th_style)],
    [Paragraph('SUPER_ADMIN', ParagraphStyle('r1', fontName='SimHei', fontSize=9, textColor=colors.HexColor('#C00000'))), 
     Paragraph('admin@casasconfortables.com', ParagraphStyle('e1', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Admin123!', ParagraphStyle('p1', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Control total', td_style)],
    [Paragraph('TEAM_LEADER', ParagraphStyle('r2', fontName='SimHei', fontSize=9, textColor=colors.HexColor('#ED7D31'))), 
     Paragraph('lider@casasconfortables.com', ParagraphStyle('e2', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Lider123!', ParagraphStyle('p2', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Gestión de equipo', td_style)],
    [Paragraph('COMMERCIAL', ParagraphStyle('r3', fontName='SimHei', fontSize=9, textColor=colors.HexColor('#70AD47'))), 
     Paragraph('carlos@casasconfortables.com', ParagraphStyle('e3', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Carlos123!', ParagraphStyle('p3', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Leads y clientes', td_style)],
    [Paragraph('WORKER', ParagraphStyle('r4', fontName='SimHei', fontSize=9, textColor=colors.HexColor('#5B9BD5'))), 
     Paragraph('trabajador@casasconfortables.com', ParagraphStyle('e4', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Trabajador123!', ParagraphStyle('p4', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Tareas y horas', td_style)],
    [Paragraph('CLIENT', ParagraphStyle('r5', fontName='SimHei', fontSize=9, textColor=colors.HexColor('#7030A0'))), 
     Paragraph('cliente@casasconfortables.com', ParagraphStyle('e5', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Cliente123!', ParagraphStyle('p5', fontName='Times New Roman', fontSize=9)), 
     Paragraph('Ver sus obras', td_style)],
]

cred_table = Table(cred_data, colWidths=[3*cm, 5*cm, 3*cm, 3*cm])
cred_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(Spacer(1, 10))
story.append(cred_table)
story.append(Spacer(1, 20))

# Section 5
story.append(Paragraph('<b>5. CONFIGURACIÓN DE NGINX</b>', h1_style))
story.append(Paragraph('Para servir la aplicación en el subdirectorio /crm:', body_style))
story.append(Paragraph('server {\n    listen 443 ssl;\n    server_name www.casasconfortables.com;\n    \n    location /crm {\n        proxy_pass http://localhost:3000;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n    }\n}', code_style))

# Section 6
story.append(Paragraph('<b>6. FUNCIONALIDADES INCLUIDAS</b>', h1_style))
story.append(Paragraph('<b>Gestión de Leads y Clientes:</b> Registro completo de leads, asignación automática, historial de interacciones, múltiples fuentes de captación.', body_style))
story.append(Paragraph('<b>Control de Obras:</b> Planificación y seguimiento con calendario visual, gestión de presupuestos, documentos adjuntos y fotos de avance.', body_style))
story.append(Paragraph('<b>Gestión de Tareas y Horas:</b> Asignación de tareas con prioridades, control horario con registro de entrada/salida, reportes de productividad.', body_style))
story.append(Paragraph('<b>Inteligencia Artificial:</b> Análisis predictivo de conversión de leads, alertas automáticas para leads sin contacto, cruce de datos para identificar oportunidades, recomendaciones basadas en datos.', body_style))
story.append(Paragraph('<b>Sistema de Roles (9 niveles):</b> SUPER_ADMIN (control total), ADMIN (gestión de empresa), TEAM_LEADER (supervisión), COMMERCIAL (gestión comercial), FRANCHISE, REAL_ESTATE, SUBCONTRACTOR, WORKER (tareas y control horario), CLIENT (portal del cliente).', body_style))

# Section 7
story.append(Paragraph('<b>7. SOPORTE Y MANTENIMIENTO</b>', h1_style))
story.append(Paragraph('Para mantener el sistema funcionando correctamente: configurar backups diarios de la base de datos, revisar actualizaciones de seguridad mensualmente, verificar logs del sistema periódicamente, y limpiar archivos temporales de forma regular.', body_style))

# Build PDF
doc.build(story)
print(f"PDF generado: {pdf_path}")
