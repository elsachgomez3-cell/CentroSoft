import pool from "../config/database";
import { notificarAdmins } from "../services/notificacion.service";

export const findAllEspecialidades = async (soloActivas = false) => {
  const where = soloActivas ? "WHERE activa = TRUE" : "";
  const result = await pool.query(
    `SELECT * FROM Especialidad ${where} ORDER BY nombre`,
  );
  return result.rows;
};

export const findEspecialidadById = async (id: number) => {
  const result = await pool.query(
    `SELECT * FROM Especialidad WHERE id_especialidad = $1`,
    [id],
  );
  return result.rows[0] || null;
};

export const createEspecialidad = async (data: {
  nombre: string;
  descripcion?: string;
}) => {
  const result = await pool.query(
    `
    INSERT INTO Especialidad (nombre, descripcion)
    VALUES ($1, $2)
    RETURNING *
  `,
    [data.nombre, data.descripcion || null],
  );

  await notificarAdmins({
    titulo: "Nueva especialidad registrada",
    mensaje: `Se registró la especialidad "${data.nombre}" en el sistema.`,
    tipo: "sistema",
  });

  return result.rows[0];
};

export const updateEspecialidad = async (
  id: number,
  data: { nombre?: string; descripcion?: string; activa?: boolean },
) => {
  const result = await pool.query(
    `
    UPDATE Especialidad SET
      nombre      = COALESCE($1, nombre),
      descripcion = COALESCE($2, descripcion),
      activa      = COALESCE($3, activa)
    WHERE id_especialidad = $4
    RETURNING *
  `,
    [data.nombre || null, data.descripcion || null, data.activa ?? null, id],
  );
  return result.rows[0];
};

export const deleteEspecialidad = async (id: number) => {
  const result = await pool.query(
    `UPDATE Especialidad SET activa = FALSE
     WHERE id_especialidad = $1
     RETURNING nombre`,
    [id],
  );
  const nombre = result.rows[0]?.nombre || "Especialidad";

  await notificarAdmins({
    titulo: "Especialidad desactivada",
    mensaje: `La especialidad "${nombre}" fue desactivada del sistema.`,
    tipo: "sistema",
  });
};
