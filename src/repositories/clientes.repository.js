const pool = require("../config/db");

async function buscarPorWhatsapp(whatsappNumero) {
  const { rows } = await pool.query("SELECT * FROM clientes WHERE whatsapp_numero = $1", [
    whatsappNumero,
  ]);
  return rows[0];
}

async function crear({ nombre, whatsappNumero }) {
  const { rows } = await pool.query(
    `INSERT INTO clientes (nombre, whatsapp_numero) VALUES ($1, $2) RETURNING *`,
    [nombre || null, whatsappNumero]
  );
  return rows[0];
}

async function obtenerOCrear({ nombre, whatsappNumero }) {
  const existente = await buscarPorWhatsapp(whatsappNumero);
  if (existente) return existente;
  return crear({ nombre, whatsappNumero });
}

async function suscribir(clienteId, negocioId) {
  const { rows } = await pool.query(
    `INSERT INTO clientes_negocios (cliente_id, negocio_id, activo)
     VALUES ($1, $2, true)
     ON CONFLICT (cliente_id, negocio_id)
     DO UPDATE SET activo = true, fecha_suscripcion = now()
     RETURNING *`,
    [clienteId, negocioId]
  );
  return rows[0];
}

async function darDeBaja(clienteId, negocioId) {
  const { rows } = await pool.query(
    `UPDATE clientes_negocios SET activo = false
     WHERE cliente_id = $1 AND negocio_id = $2
     RETURNING *`,
    [clienteId, negocioId]
  );
  return rows[0];
}

async function listarSuscritos(negocioId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.nombre, c.whatsapp_numero, cn.fecha_suscripcion, cn.activo
     FROM clientes c
     JOIN clientes_negocios cn ON cn.cliente_id = c.id
     WHERE cn.negocio_id = $1 AND cn.activo = true
     ORDER BY cn.fecha_suscripcion DESC`,
    [negocioId]
  );
  return rows;
}

module.exports = {
  buscarPorWhatsapp,
  crear,
  obtenerOCrear,
  suscribir,
  darDeBaja,
  listarSuscritos,
};
