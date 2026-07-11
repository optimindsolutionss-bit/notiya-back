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

module.exports = { buscarPorCorreo, crearUsuario };