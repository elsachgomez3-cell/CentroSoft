-- ============================================================
-- CENTROSOFT
-- ADMINISTRADOR INICIAL
-- ============================================================

-- ROL ADMIN

INSERT INTO Rol (nombre, descripcion) VALUES
    ('admin',           'Administrador del sistema. Gestiona personal, pacientes, especialidades y horarios.'),
    ('paciente',        'Paciente registrado. Puede agendar, reprogramar y cancelar sus propias citas.'),
    ('medico',          'Médico del centro. Ve su agenda, marca asistencia de pacientes.'),
    ('gerente',         'Gerente. Acceso a reportes y estadísticas del centro. Solo lectura.'),
    ('recepcionista',   'Recepcionista. Gestiona citas, registra pacientes, maneja sala de espera.'),
    ('enfermera',       'Enfermera. Ve lista de espera, agenda del día y ficha rápida del paciente.'),
    ('auxiliar',        'Auxiliar de enfermería. Ve horarios disponibles y calendario de citas.');

-- USUARIO ADMIN

INSERT INTO Usuario (
    id_rol,
    nom_usuario,
    contrasena_hash,
    estado
)
VALUES (
    1,
    'admin_cs',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'activo'
);

-- DATOS PERSONALES ADMIN

INSERT INTO Personal (
    id_usuario,
    primer_nombre,
    apellido_pat,
    apellido_mat,
    email,
    telefono
)
VALUES (
    1,
    'Juan',
    'Condori',
    'Mamani',
    'admin@centrosoft.com',
    '78900001'
);