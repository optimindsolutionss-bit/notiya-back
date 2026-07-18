const pool = require("../config/db");

async function obtenerAcceso(negocioId, usuarioId) {
  const { rows } = await pool.query(
    "SELECT rol FROM negocio_usuarios WHERE negocio_id = $1 AND usuario_id = $2",
    [negocioId, usuarioId]
  );
  return rows[0];
}

async function agregarUsuario({ negocioId, usuarioId, rol }) {
  const { rows } = await pool.query(
    `INSERT INTO negocio_usuarios (negocio_id, usuario_id, rol)
     VALUES ($1, $2, $3)
     RETURNING id, negocio_id, usuario_id, rol`,
    [negocioId, usuarioId, rol]
  );
  return rows[0];
}

async function listarPorNegocio(negocioId) {
  const { rows } = await pool.query(
    `SELECT nu.id, nu.rol, u.id AS usuario_id, u.nombre, u.correo
     FROM negocio_usuarios nu
     JOIN usuarios u ON u.id = nu.usuario_id
     WHERE nu.negocio_id = $1`,
    [negocioId]
  );
  return rows;
}

module.exports = { obtenerAcceso, agregarUsuario, listarPorNegocio };
