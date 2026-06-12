-- ============================================================
-- CENTROSOFT
-- ESQUEMA COMPLETO DE BASE DE DATOS
-- Versión 2.0
-- ============================================================

CREATE DATABASE centrosoft;
-- 2. Conectarse a ella:
--    \c centrosoft
-- 3. Ejecutar este archivo:
--    \i ruta/al/archivo/01_schema.sql
-- ============================================================


-- ============================================================
-- SECCIÓN 1: TIPOS ENUM
-- Los ENUMs son listas cerradas de valores permitidos.
-- PostgreSQL rechaza AUTOMÁTICAMENTE cualquier valor
-- que no esté en la lista, sin que el backend tenga que
-- validarlo manualmente.
-- ============================================================

-- Estado de un usuario en el sistema
CREATE TYPE estado_usuario AS ENUM (
    'activo',       -- puede iniciar sesión normalmente
    'inactivo',     -- deshabilitado temporalmente
    'suspendido'    -- bloqueado por el administrador
);

-- Estado de una cita médica a lo largo de su ciclo de vida.
-- Flujo normal:    programada → en_espera → atendida
-- Flujo ausencia:  programada → inasistente
-- Flujo cancelado: programada → cancelada
CREATE TYPE estado_cita AS ENUM (
    'programada',   -- cita agendada, paciente aún no llega
    'en_espera',    -- paciente llegó, espera ser atendido
    'atendida',     -- consulta completada exitosamente
    'cancelada',    -- cancelada por paciente, recepcionista o admin
    'inasistente'   -- el paciente no se presentó
);

-- Tipo de notificación para clasificar y filtrar avisos
CREATE TYPE tipo_notificacion AS ENUM (
    'cita_agendada',
    'cita_cancelada',
    'cita_reprogramada',
    'recordatorio',
    'sistema'
);


-- ============================================================
-- SECCIÓN 2: TABLA Rol
-- Catálogo de roles del sistema.
-- Reemplaza el campo rol VARCHAR libre que había en la BD
-- anterior. Con esta tabla, los roles son valores controlados.
-- ============================================================

CREATE TABLE Rol (
    id_rol      SERIAL        PRIMARY KEY,
    nombre      VARCHAR(50)   NOT NULL UNIQUE,
    descripcion TEXT
);


-- ============================================================
-- SECCIÓN 3: TABLA Usuario
-- Credenciales de acceso de TODOS los usuarios del sistema
-- (pacientes, médicos, admin, enfermeras, recepcionistas, etc.)
-- La información personal está en Paciente o Personal.
-- ============================================================

CREATE TABLE Usuario (
    id_usuario      SERIAL          PRIMARY KEY,
    id_rol          INT             NOT NULL,
    nom_usuario     VARCHAR(100)    NOT NULL UNIQUE,
    -- NUNCA texto plano. Este campo guarda el hash de bcrypt.
    -- El backend es responsable de hashear antes de guardar.
    contrasena_hash VARCHAR(255)    NOT NULL,
    estado          estado_usuario  NOT NULL DEFAULT 'activo',
    fecha_creacion  TIMESTAMP       NOT NULL DEFAULT NOW(),
    ultimo_acceso   TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
);


-- ============================================================
-- SECCIÓN 4: TABLA Personal
-- Información de todos los empleados del centro:
-- médicos, enfermeras, recepcionistas, auxiliares, admin, gerentes.
-- ============================================================

CREATE TABLE Personal (
    id_personal     SERIAL        PRIMARY KEY,
    id_usuario      INT           NOT NULL UNIQUE,
    primer_nombre   VARCHAR(100)  NOT NULL,
    apellido_pat    VARCHAR(100)  NOT NULL,
    apellido_mat    VARCHAR(100),
    email           VARCHAR(150)  UNIQUE,
    -- Sin UNIQUE: dos empleados pueden compartir número de contacto
    telefono        VARCHAR(20),
    foto_url        TEXT,
    fecha_creacion  TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_personal_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
        ON DELETE CASCADE
);


-- ============================================================
-- SECCIÓN 5: TABLA Paciente
-- Información personal de los pacientes.
-- Separada de Personal porque tienen datos distintos
-- y accesos distintos al sistema.
-- ============================================================

CREATE TABLE Paciente (
    id_paciente     SERIAL        PRIMARY KEY,
    id_usuario      INT           NOT NULL UNIQUE,
    primer_nombre   VARCHAR(100)  NOT NULL,
    apellido_pat    VARCHAR(100)  NOT NULL,
    apellido_mat    VARCHAR(100),
    ci              VARCHAR(20)   UNIQUE,
    email           VARCHAR(150)  UNIQUE,
    -- Sin UNIQUE: en Bolivia varios familiares comparten número
    telefono        VARCHAR(20),
    direccion       VARCHAR(255),
    -- Campo edad ELIMINADO intencionalmente.
    -- La edad se calcula desde fecha_nac en tiempo real:
    -- DATE_PART('year', AGE(fecha_nac))
    -- Esto evita datos incorrectos y es requerido para
    -- el reporte de rangos de edad del Gerente.
    fecha_nac       DATE,
    foto_url        TEXT,
    fecha_registro  TIMESTAMP     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_paciente_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
        ON DELETE CASCADE
);


-- ============================================================
-- SECCIÓN 6: TABLA Especialidad
-- Catálogo de áreas médicas del centro de salud.
-- ============================================================

CREATE TABLE Especialidad (
    id_especialidad SERIAL        PRIMARY KEY,
    nombre          VARCHAR(100)  NOT NULL UNIQUE,
    descripcion     TEXT,
    -- activa=FALSE desactiva sin eliminar, preserva el historial
    activa          BOOLEAN       NOT NULL DEFAULT TRUE
);


-- ============================================================
-- SECCIÓN 7: TABLA PersonalEspecialidad
-- Relación muchos-a-muchos entre médicos y especialidades.
-- Un médico puede tener varias especialidades.
-- Una especialidad la ejercen varios médicos.
-- ============================================================

CREATE TABLE PersonalEspecialidad (
    id_personal     INT   NOT NULL,
    id_especialidad INT   NOT NULL,

    PRIMARY KEY (id_personal, id_especialidad),

    CONSTRAINT fk_pe_personal
        FOREIGN KEY (id_personal) REFERENCES Personal(id_personal)
        ON DELETE CASCADE,
    CONSTRAINT fk_pe_especialidad
        FOREIGN KEY (id_especialidad) REFERENCES Especialidad(id_especialidad)
        ON DELETE CASCADE
);


-- ============================================================
-- SECCIÓN 8: TABLA Horario
-- Define los horarios de atención de un médico
-- en una especialidad específica.
-- Los turnos mañana y tarde están modelados explícitamente,
-- reflejando el wireframe del PDF.
-- Los días de trabajo van en HorarioDetalle (siguiente tabla).
-- ============================================================

CREATE TABLE Horario (
    id_horario            SERIAL    PRIMARY KEY,
    id_personal           INT       NOT NULL,
    id_especialidad       INT       NOT NULL,
    -- Turno mañana (NULL si no trabaja en la mañana)
    hora_inicio_manana    TIME,
    hora_fin_manana       TIME,
    -- Turno tarde (NULL si no trabaja en la tarde)
    hora_inicio_tarde     TIME,
    hora_fin_tarde        TIME,
    -- Nombre explícito: duracion_cita_MIN, no duracion_cita
    -- Valores permitidos: 15, 20, 30, 45 o 60 minutos
    duracion_cita_min     SMALLINT  NOT NULL DEFAULT 30
                          CHECK (duracion_cita_min IN (15, 20, 30, 45, 60)),
    activo                BOOLEAN   NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_horario_personal
        FOREIGN KEY (id_personal) REFERENCES Personal(id_personal),
    CONSTRAINT fk_horario_especialidad
        FOREIGN KEY (id_especialidad) REFERENCES Especialidad(id_especialidad)
);


-- ============================================================
-- SECCIÓN 9: TABLA HorarioDetalle
-- Almacena los días específicos en que aplica un horario.
-- Una fila por día. Reemplaza el campo dias VARCHAR.
--
-- Ejemplo real:
-- El Dr. Gómez trabaja Lunes, Martes y Jueves →
--   INSERT (id_horario=1, dia_semana=0)  -- Lunes
--   INSERT (id_horario=1, dia_semana=1)  -- Martes
--   INSERT (id_horario=1, dia_semana=3)  -- Jueves
--
-- Convención numérica:
--   0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves,
--   4=Viernes, 5=Sábado, 6=Domingo
-- ============================================================

CREATE TABLE HorarioDetalle (
    id_horario_det  SERIAL    PRIMARY KEY,
    id_horario      INT       NOT NULL,
    dia_semana      SMALLINT  NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),

    -- Un horario no puede tener el mismo día registrado dos veces
    UNIQUE (id_horario, dia_semana),

    CONSTRAINT fk_hdet_horario
        FOREIGN KEY (id_horario) REFERENCES Horario(id_horario)
        ON DELETE CASCADE
);


-- ============================================================
-- SECCIÓN 10: TABLA Cita
-- Reserva de atención médica.
--
-- Decisión de diseño importante:
-- La cita referencia id_horario (no id_personal ni id_especialidad
-- directamente) porque toda esa información ya está en Horario.
-- Se obtiene con un JOIN: Cita → Horario → Personal/Especialidad.
-- Una sola fuente de verdad.
-- ============================================================

CREATE TABLE Cita (
    id_cita             SERIAL      PRIMARY KEY,
    id_paciente         INT         NOT NULL,
    id_horario          INT         NOT NULL,
    fecha               DATE        NOT NULL,
    hora                TIME        NOT NULL,
    motivo              TEXT,
    estado              estado_cita NOT NULL DEFAULT 'programada',
    -- Se completa cuando estado = 'cancelada'
    motivo_cancelacion  TEXT,
    fecha_creacion      TIMESTAMP   NOT NULL DEFAULT NOW(),

    -- PROTECCIÓN CONTRA DOBLE RESERVA:
    -- Ningún médico puede tener dos citas
    -- en el mismo horario, misma fecha y misma hora.
    -- PostgreSQL rechaza el segundo INSERT automáticamente.
    CONSTRAINT uq_cita_sin_doble_reserva
        UNIQUE (id_horario, fecha, hora),

    CONSTRAINT fk_cita_paciente
        FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente),
    CONSTRAINT fk_cita_horario
        FOREIGN KEY (id_horario) REFERENCES Horario(id_horario)
);


-- ============================================================
-- SECCIÓN 11: TABLA HistorialCita
-- Registra cada cambio aplicado a una cita.
-- Incluye reprogramaciones, cancelaciones y cambios de estado.
-- id_usuario_resp es FK real (no string como en la BD anterior).
-- ============================================================

CREATE TABLE HistorialCita (
    id_historial      SERIAL      PRIMARY KEY,
    id_cita           INT         NOT NULL,
    id_usuario_resp   INT         NOT NULL,
    fecha_anterior    DATE,
    hora_anterior     TIME,
    fecha_nueva       DATE,
    hora_nueva        TIME,
    estado_anterior   estado_cita,
    estado_nuevo      estado_cita,
    motivo_cambio     TEXT,
    fecha_cambio      TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_hist_cita
        FOREIGN KEY (id_cita) REFERENCES Cita(id_cita),
    CONSTRAINT fk_hist_usuario
        FOREIGN KEY (id_usuario_resp) REFERENCES Usuario(id_usuario)
);


-- ============================================================
-- SECCIÓN 12: TABLA Notificacion
-- Avisos del sistema para cualquier usuario.
-- id_cita es NULLABLE: no toda notificación viene de una cita.
-- Ejemplo de notificación sin cita: "Bienvenido al sistema"
-- ============================================================

CREATE TABLE Notificacion (
    id_notificacion SERIAL              PRIMARY KEY,
    id_usuario      INT                 NOT NULL,
    id_cita         INT,                -- nullable intencionalmente
    titulo          VARCHAR(200)        NOT NULL,
    mensaje         TEXT                NOT NULL,
    tipo            tipo_notificacion   NOT NULL DEFAULT 'sistema',
    leida           BOOLEAN             NOT NULL DEFAULT FALSE,
    fecha_envio     TIMESTAMP           NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notif_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    CONSTRAINT fk_notif_cita
        FOREIGN KEY (id_cita) REFERENCES Cita(id_cita)
        ON DELETE SET NULL
);


-- ============================================================
-- SECCIÓN 13: TABLA AuditoriaLog
-- Registro de acciones críticas del sistema para trazabilidad.
-- BIGSERIAL porque puede acumular millones de registros.
-- JSONB para los valores permite consultar campos específicos.
-- ============================================================

CREATE TABLE AuditoriaLog (
    id_auditoria        BIGSERIAL    PRIMARY KEY,
    -- Nullable: algunas acciones son del sistema, no de un usuario
    id_usuario_resp     INT,
    -- Snapshot del nombre en el momento exacto del log
    nombre_usuario      VARCHAR(150),
    tabla_afectada      VARCHAR(100) NOT NULL,
    accion              VARCHAR(20)  NOT NULL
                        CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    id_registro         BIGINT,
    -- JSONB permite consultas como:
    -- WHERE valores_nuevos->>'estado' = 'cancelada'
    valores_anteriores  JSONB,
    valores_nuevos      JSONB,
    fecha               TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_usuario
        FOREIGN KEY (id_usuario_resp) REFERENCES Usuario(id_usuario)
        ON DELETE SET NULL
);

-- ============================================================
-- SECCIÓN 14: TABLA MensajeContacto
-- Mensajes enviados desde el formulario de contacto
-- de la landing page. No requiere autenticación.
-- ============================================================

CREATE TABLE MensajeContacto (
    id_mensaje      SERIAL       PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    asunto          VARCHAR(200) NOT NULL,
    mensaje         TEXT         NOT NULL,
    leido           BOOLEAN      NOT NULL DEFAULT FALSE,
    correo_enviado  BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_envio     TIMESTAMP    NOT NULL DEFAULT NOW()
);
-- ============================================================
-- SECCIÓN 15: ÍNDICES DE RENDIMIENTO
-- Sin índices, PostgreSQL recorre TODA la tabla para cada
-- consulta (full scan). Con índices, las consultas frecuentes
-- son casi instantáneas incluso con miles de registros.
-- ============================================================

-- Listado de citas por fecha (pantalla principal de recepcionista)
CREATE INDEX ix_cita_fecha
    ON Cita(fecha);

-- Citas de un paciente (historial del paciente)
CREATE INDEX ix_cita_paciente
    ON Cita(id_paciente);

-- Agenda del médico por horario
CREATE INDEX ix_cita_horario
    ON Cita(id_horario);

-- Disponibilidad: citas no canceladas en una fecha
CREATE INDEX ix_cita_estado_fecha
    ON Cita(estado, fecha)
    WHERE estado != 'cancelada';

-- Notificaciones no leídas de un usuario
CREATE INDEX ix_notif_usuario_leida
    ON Notificacion(id_usuario, leida);

-- Búsqueda de paciente por CI (recepcionista)
CREATE INDEX ix_paciente_ci
    ON Paciente(ci);

-- Horarios activos de un médico
CREATE INDEX ix_horario_personal
    ON Horario(id_personal)
    WHERE activo = TRUE;

-- Días de un horario (para calendario de disponibilidad)
CREATE INDEX ix_hdet_dia
    ON HorarioDetalle(id_horario, dia_semana);
