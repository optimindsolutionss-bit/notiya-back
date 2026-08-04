const pool = require("../config/db");

async function crear(negocioId, { categoriaId, nombre, descripcion, precio, imagenUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio, imagen_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [negocioId, categoriaId || null, nombre, descripcion || null, precio, imagenUrl || null]
  );
  return rows[0];
}

async function listarPorNegocio(negocioId) {
  const { rows } = await pool.query(
    "SELECT * FROM productos WHERE negocio_id = $1 ORDER BY nombre",
    [negocioId]
  );
  return rows;
}

async function buscarPorId(negocioId, productoId) {
  const { rows } = await pool.query(
    "SELECT * FROM productos WHERE id = $1 AND negocio_id = $2",
    [productoId, negocioId]
  );
  return rows[0];
}

async function actualizar(negocioId, productoId, campos) {
  const columnas = Object.keys(campos);
  if (columnas.length === 0) return buscarPorId(negocioId, productoId);
  const asignaciones = columnas.map((col, i) => `${col} = $${i + 3}`).join(", ");
  const valores = columnas.map((col) => campos[col]);
  const { rows } = await pool.query(
    `UPDATE productos SET ${asignaciones}, updated_at = now()
     WHERE id = $1 AND negocio_id = $2 RETURNING *`,
    [productoId, negocioId, ...valores]
  );
  return rows[0];
}

async function eliminar(negocioId, productoId) {
  const { rowCount } = await pool.query(
    "DELETE FROM productos WHERE id = $1 AND negocio_id = $2",
    [productoId, negocioId]
  );
  return rowCount > 0;
}

async function buscarPorNombreAproximado(negocioId, textoBusqueda) {
  const { rows } = await pool.query(
    `SELECT * FROM productos
     WHERE negocio_id = $1 AND nombre ILIKE $2
     ORDER BY length(nombre) ASC
     LIMIT 1`,
    [negocioId, `%${textoBusqueda}%`]
  );
  return rows[0];
}

async function listarBasico(negocioId) {
  const { rows } = await pool.query(
    "SELECT id, nombre FROM productos WHERE negocio_id = $1 ORDER BY nombre",
    [negocioId]
  );
  return rows;
}

module.exports = {
  crear,
  listarPorNegocio,
  listarBasico,
  buscarPorId,
  actualizar,
  eliminar,
  buscarPorNombreAproximado,
};
