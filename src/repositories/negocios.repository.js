const pool = require("../config/db");

async function crearNegocio({ nombre, tipoNegocio, direccion, telefonoContacto, correoContacto }) {
  const { rows } = await pool.query(
    `INSERT INTO negocios (nombre, tipo_negocio, direccion, telefono_contacto, correo_contacto)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [nombre, tipoNegocio, direccion, telefonoContacto, correoContacto]
  );
  return rows[0];
}

async function listarPorUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT n.*, nu.rol
     FROM negocios n
     JOIN negocio_usuarios nu ON nu.negocio_id = n.id
     WHERE nu.usuario_id = $1
     ORDER BY n.created_at DESC`,
    [usuarioId]
  );
  return rows;
}

async function buscarPorId(negocioId) {
  const { rows } = await pool.query("SELECT * FROM negocios WHERE id = $1", [negocioId]);
  return rows[0];
}

async function listarTodos() {
  const { rows } = await pool.query(
    `SELECT n.*, u.id AS dueno_id, u.nombre AS dueno_nombre, u.correo AS dueno_correo
     FROM negocios n
     LEFT JOIN negocio_usuarios nu ON nu.negocio_id = n.id AND nu.rol = 'dueño'
     LEFT JOIN usuarios u ON u.id = nu.usuario_id
     ORDER BY n.created_at DESC`
  );
  return rows;
}

async function actualizarNegocio(negocioId, campos) {
  const columnas = Object.keys(campos);
  if (columnas.length === 0) return buscarPorId(negocioId);
  const asignaciones = columnas.map((col, i) => `${col} = $${i + 2}`).join(", ");
  const valores = columnas.map((col) => campos[col]);
  const { rows } = await pool.query(
    `UPDATE negocios SET ${asignaciones}, updated_at = now() WHERE id = $1 RETURNING *`,
    [negocioId, ...valores]
  );
  return rows[0];
}

async function reemplazarHorario(negocioId, dias) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    await cliente.query("DELETE FROM horarios_negocio WHERE negocio_id = $1", [negocioId]);
    for (const dia of dias) {
      await cliente.query(
        `INSERT INTO horarios_negocio (negocio_id, dia_semana, hora_apertura, hora_cierre, cerrado)
         VALUES ($1, $2, $3, $4, $5)`,
        [negocioId, dia.diaSemana, dia.horaApertura || null, dia.horaCierre || null, Boolean(dia.cerrado)]
      );
    }
    await cliente.query("COMMIT");
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
  const { rows } = await pool.query(
    "SELECT * FROM horarios_negocio WHERE negocio_id = $1 ORDER BY dia_semana",
    [negocioId]
  );
  return rows;
}

async function obtenerHorario(negocioId) {
  const { rows } = await pool.query(
    "SELECT * FROM horarios_negocio WHERE negocio_id = $1 ORDER BY dia_semana",
    [negocioId]
  );
  return rows;
}

module.exports = {
  crearNegocio,
  listarPorUsuario,
  buscarPorId,
  listarTodos,
  actualizarNegocio,
  reemplazarHorario,
  obtenerHorario,
};
