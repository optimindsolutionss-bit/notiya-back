const pool = require("../config/db");

async function buscarPorCorreo(correo) {
  const { rows } = await pool.query(
    "SELECT * FROM usuarios WHERE correo = $1",
    [correo]
  );
  return rows[0];
}

async function crearUsuario({ nombre, correo, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, correo`,
    [nombre, correo, passwordHash]
  );
  return rows[0];
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    "SELECT id, nombre, correo, es_superadmin FROM usuarios WHERE id = $1",
    [id]
  );
  return rows[0];
}

async function buscarPorCorreoParcial(correo) {
  const { rows } = await pool.query(
    `SELECT id, nombre, correo FROM usuarios
     WHERE correo ILIKE $1
     ORDER BY correo
     LIMIT 20`,
    [`%${correo}%`]
  );
  return rows;
}

async function listarTodos({ limit = 200, offset = 0 } = {}) {
  const { rows } = await pool.query(
    "SELECT id, nombre, correo, es_superadmin FROM usuarios ORDER BY id LIMIT $1 OFFSET $2",
    [limit, offset]
  );
  return rows;
}

async function actualizarSuperAdmin(id, esSuperAdmin) {
  const { rows } = await pool.query(
    "UPDATE usuarios SET es_superadmin = $2 WHERE id = $1 RETURNING id, nombre, correo, es_superadmin",
    [id, esSuperAdmin]
  );
  return rows[0];
}

module.exports = { buscarPorCorreo, crearUsuario, buscarPorId, buscarPorCorreoParcial, listarTodos, actualizarSuperAdmin };