const pool = require("../config/db");

async function crear(negocioId, nombre) {
  const { rows } = await pool.query(
    `INSERT INTO categorias (negocio_id, nombre) VALUES ($1, $2) RETURNING *`,
    [negocioId, nombre]
  );
  return rows[0];
}

async function listarPorNegocio(negocioId) {
  const { rows } = await pool.query(
    "SELECT * FROM categorias WHERE negocio_id = $1 ORDER BY nombre",
    [negocioId]
  );
  return rows;
}

async function actualizar(negocioId, categoriaId, nombre) {
  const { rows } = await pool.query(
    `UPDATE categorias SET nombre = $1 WHERE id = $2 AND negocio_id = $3 RETURNING *`,
    [nombre, categoriaId, negocioId]
  );
  return rows[0];
}

async function eliminar(negocioId, categoriaId) {
  const { rowCount } = await pool.query(
    "DELETE FROM categorias WHERE id = $1 AND negocio_id = $2",
    [categoriaId, negocioId]
  );
  return rowCount > 0;
}

module.exports = { crear, listarPorNegocio, actualizar, eliminar };
