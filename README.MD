# CentroSoft - Sistema de Gestión Médica

## Descripción

CentroSoft es un sistema de gestión médica desarrollado para administrar:

* Pacientes
* Personal médico
* Especialidades
* Horarios
* Citas médicas
* Notificaciones
* Reportes
* Historial clínico
* Auditoría de acciones

El sistema cuenta con los siguientes roles:

* Administrador
* Gerente
* Médico
* Paciente
* Recepcionista
* Enfermera
* Auxiliar

---

# Tecnologías utilizadas

## Frontend

* React
* TypeScript
* Vite
* Bootstrap
* Axios
* React Router DOM
* React Hook Form
* Recharts
* jsPDF
* XLSX

## Backend

* Node.js
* Express
* TypeScript
* JWT
* Bcrypt

## Base de Datos

* PostgreSQL 17

---

# Requisitos previos

Instalar:

* Node.js
* PostgreSQL
* pgAdmin 4
* Git (opcional)

---

# Configuración de la Base de Datos

## Paso 1

Abrir pgAdmin.

Crear una base de datos llamada exactamente:

```sql
centrosoft
```

## Paso 2

Abrir Query Tool.

Ejecutar el archivo:

```text
01_schema.sql
```

Este archivo crea:

* Tablas
* Relaciones
* Restricciones
* Índices
* Enumeradores

## Paso 3

Ejecutar el script de administrador:

```text
admin.sql
```

Esto creará:

* Rol administrador
* Usuario administrador
* Personal administrador

Usuario inicial:

```text
Usuario: admin_cs
Contraseña: password
```

---

# Configuración Backend

Abrir la carpeta:

```text
backend
```

Crear o configurar el archivo:

```env
.env
```

Configurar:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=centrosoft
DB_USER=postgres
DB_PASSWORD=TU_CONTRASEÑA_POSTGRES

JWT_SECRET=TU_SECRET

EMAIL_USER=
EMAIL_PASSWORD=
```

IMPORTANTE:

La contraseña de PostgreSQL debe coincidir con la utilizada durante la instalación.

---

# Configuración de Gmail

El sistema utiliza Gmail para el envío de correos.

Configurar:

```env
EMAIL_USER=
EMAIL_PASSWORD=
```

Además:

1. Activar verificación en dos pasos.
2. Crear una contraseña de aplicación.
3. Utilizar esa contraseña en EMAIL_PASSWORD.

---

# Ejecución del Backend

Abrir una terminal.

Ingresar a:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
npm run dev
```

Si todo funciona correctamente, el servidor iniciará sin errores.

---

# Ejecución del Frontend

Abrir una segunda terminal.

Ingresar a:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
npm run dev
```

Vite mostrará una URL similar a:

```text
http://localhost:5173
```

Abrir esa dirección en el navegador.

---

# Estructura General

```text
CentroSoft
│
├── backend
│
├── frontend
│
├── database
│   ├── 01_schema.sql
│   └── admin.sql
│
└── README.md
```

---

# Primer Inicio

Ingresar con:

```text
Usuario: admin_cs
Contraseña: Password
```

Desde el módulo Administrador se pueden crear:

* Médicos
* Gerentes
* Recepcionistas
* Enfermeras
* Auxiliares
* Pacientes
* Especialidades
* Horarios

---

# Funcionalidades Principales

## Administrador

* Gestión de usuarios
* Gestión de personal
* Gestión de especialidades
* Gestión de horarios
* Gestión de notificaciones

## Gerente

* Reportes
* Estadísticas
* Exportación PDF
* Exportación Excel

## Médico

* Agenda médica
* Atención del día
* Historial de citas

## Paciente

* Solicitar citas
* Cancelar citas
* Ver historial
* Recibir notificaciones

## Recepcionista

* Gestión de citas
* Registro de pacientes

---

# Solución de Problemas

## Error de conexión a PostgreSQL

Verificar:

```env
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

---

## Error "relation does not exist"

Volver a ejecutar:

```text
01_schema.sql
```

---

## Error al iniciar frontend

Ejecutar:

```bash
npm install
```

antes de:

```bash
npm run dev
```

---

## Error al iniciar backend

Ejecutar:

```bash
npm install
```

antes de:

```bash
npm run dev
```

---

# Notas

* Iniciar primero PostgreSQL.
* Luego Backend.
* Finalmente Frontend.
* No modificar la estructura de la base de datos sin actualizar el backend.
* No modificar las variables de entorno sin verificar las dependencias correspondientes.

---

# Proyecto Académico

CentroSoft fue desarrollado como sistema integral de gestión médica para la administración de pacientes, personal, horarios y citas médicas.
