const pool = require("../config/db");

async function crear(negocioId, { nombre, tipo, contenido }) {
  const { rows } = await pool.query(
    `INSERT INTO plantillas_mensajes (negocio_id, nombre, tipo, contenido)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [negocioId, nombre, tipo, contenido]
  );
  return rows[0];
}

async function listarPorNegocio(negocioId) {
  const { rows } = await pool.query(
    "SELECT * FROM plantillas_mensajes WHERE negocio_id = $1 ORDER BY nombre",
    [negocioId]
  );
  return rows;
}

async function buscarPorId(negocioId, plantillaId) {
  const { rows } = await pool.query(
    "SELECT * FROM plantillas_mensajes WHERE id = $1 AND negocio_id = $2",
    [plantillaId, negocioId]
  );
  return rows[0];
}

async function actualizar(negocioId, plantillaId, campos) {
  const columnas = Object.keys(campos);
  if (columnas.length === 0) return buscarPorId(negocioId, plantillaId);
  const asignaciones = columnas.map((col, i) => `${col} = $${i + 3}`).join(", ");
  const valores = columnas.map((col) => campos[col]);
  const { rows } = await pool.query(
    `UPDATE plantillas_mensajes SET ${asignaciones} WHERE id = $1 AND negocio_id = $2 RETURNING *`,
    [plantillaId, negocioId, ...valores]
  );
  return rows[0];
}

async function eliminar(negocioId, plantillaId) {
  const { rowCount } = await pool.query(
    "DELETE FROM plantillas_mensajes WHERE id = $1 AND negocio_id = $2",
    [plantillaId, negocioId]
  );
  return rowCount > 0;
}

module.exports = { crear, listarPorNegocio, buscarPorId, actualizar, eliminar };
