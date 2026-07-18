const pool = require("../config/db");

async function crearParaClientes(mensajeId, clienteIds) {
  if (clienteIds.length === 0) return [];
  const valores = [];
  const parametros = [];
  clienteIds.forEach((clienteId, i) => {
    valores.push(`($${i * 2 + 1}, $${i * 2 + 2})`);
    parametros.push(mensajeId, clienteId);
  });
  const { rows } = await pool.query(
    `INSERT INTO envios_whatsapp (mensaje_id, cliente_id)
     VALUES ${valores.join(", ")}
     ON CONFLICT (mensaje_id, cliente_id) DO NOTHING
     RETURNING *`,
    parametros
  );
  return rows;
}

async function listarPorMensaje(mensajeId) {
  const { rows } = await pool.query(
    "SELECT * FROM envios_whatsapp WHERE mensaje_id = $1",
    [mensajeId]
  );
  return rows;
}

async function actualizarEstado(envioId, { estado, proveedorMensajeId, errorDetalle, fechaEnvio }) {
  const { rows } = await pool.query(
    `UPDATE envios_whatsapp
     SET estado = $1, proveedor_mensaje_id = $2, error_detalle = $3, fecha_envio = $4
     WHERE id = $5
     RETURNING *`,
    [estado, proveedorMensajeId || null, errorDetalle || null, fechaEnvio || null, envioId]
  );
  return rows[0];
}

module.exports = { crearParaClientes, listarPorMensaje, actualizarEstado };
