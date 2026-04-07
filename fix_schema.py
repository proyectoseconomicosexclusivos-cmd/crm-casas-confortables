import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Fix the ProjectPlan model - remove the problematic self-relation
old_plan = '''model ProjectPlan {
  id              String          @id @default(cuid())
  projectId       String
  uploadedById    String          // Arquitecto que sube
  
  // Datos del plano
  name            String
  description     String?
  type            PlanType        @default(FLOOR_PLAN)
  floor           Int?            // Planta (0=baja, 1=primera, etc.)
  scale           String?         // Escala (1:100, etc.)
  
  // Archivo
  fileName        String
  filePath        String          // URL del archivo
  fileSize        Int?
  mimeType        String?
  
  // Versionado
  version         Int             @default(1)
  parentPlanId    String?         // Para versiones anteriores
  
  // Dimensiones del plano
  width           Float?          // Ancho en metros
  height          Float?          // Alto en metros
  
  // Estado
  isActive        Boolean         @default(true)
  
  // Visibilidad
  visibleToClient Boolean         @default(false)
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Relaciones
  project         ArchitectProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  versions        ProjectPlan[]   @relation("PlanVersions")
  
  @@index([projectId])
  @@index([type])
  @@index([uploadedById])
}'''

new_plan = '''model ProjectPlan {
  id              String          @id @default(cuid())
  projectId       String
  uploadedById    String          // Arquitecto que sube
  
  // Datos del plano
  name            String
  description     String?
  type            PlanType        @default(FLOOR_PLAN)
  floor           Int?            // Planta (0=baja, 1=primera, etc.)
  scale           String?         // Escala (1:100, etc.)
  
  // Archivo
  fileName        String
  filePath        String          // URL del archivo
  fileSize        Int?
  mimeType        String?
  
  // Versionado
  version         Int             @default(1)
  parentPlanId    String?         // Para versiones anteriores
  
  // Dimensiones del plano
  width           Float?          // Ancho en metros
  height          Float?          // Alto en metros
  
  // Estado
  isActive        Boolean         @default(true)
  
  // Visibilidad
  visibleToClient Boolean         @default(false)
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Relaciones
  project         ArchitectProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId])
  @@index([type])
  @@index([uploadedById])
}'''

content = content.replace(old_plan, new_plan)

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

print("Schema fixed")
