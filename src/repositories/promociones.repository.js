const pool = require("../config/db");

async function crear(negocioId, { productoId, titulo, descripcion, precioPromocional, fechaInicio, fechaFin }) {
  const { rows } = await pool.query(
    `INSERT INTO promociones (negocio_id, producto_id, titulo, descripcion, precio_promocional, fecha_inicio, fecha_fin)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [negocioId, productoId || null, titulo, descripcion || null, precioPromocional || null, fechaInicio, fechaFin]
  );
  return rows[0];
}

async function listarPorNegocio(negocioId) {
  const { rows } = await pool.query(
    "SELECT * FROM promociones WHERE negocio_id = $1 ORDER BY fecha_inicio DESC",
    [negocioId]
  );
  return rows;
}

async function listarActivas(negocioId) {
  const { rows } = await pool.query(
    `SELECT * FROM promociones
     WHERE negocio_id = $1 AND activo = true AND now() BETWEEN fecha_inicio AND fecha_fin
     ORDER BY fecha_inicio DESC`,
    [negocioId]
  );
  return rows;
}

async function buscarPorId(negocioId, promocionId) {
  const { rows } = await pool.query(
    "SELECT * FROM promociones WHERE id = $1 AND negocio_id = $2",
    [promocionId, negocioId]
  );
  return rows[0];
}

async function actualizar(negocioId, promocionId, campos) {
  const columnas = Object.keys(campos);
  if (columnas.length === 0) return buscarPorId(negocioId, promocionId);
  const asignaciones = columnas.map((col, i) => `${col} = $${i + 3}`).join(", ");
  const valores = columnas.map((col) => campos[col]);
  const { rows } = await pool.query(
    `UPDATE promociones SET ${asignaciones} WHERE id = $1 AND negocio_id = $2 RETURNING *`,
    [promocionId, negocioId, ...valores]
  );
  return rows[0];
}

async function eliminar(negocioId, promocionId) {
  const { rowCount } = await pool.query(
    "DELETE FROM promociones WHERE id = $1 AND negocio_id = $2",
    [promocionId, negocioId]
  );
  return rowCount > 0;
}

module.exports = { crear, listarPorNegocio, listarActivas, buscarPorId, actualizar, eliminar };
