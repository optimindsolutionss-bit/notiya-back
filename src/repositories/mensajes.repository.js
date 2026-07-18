const pool = require("../config/db");

async function crear(negocioId, datos) {
  const { rows } = await pool.query(
    `INSERT INTO mensajes
       (negocio_id, usuario_id, producto_id, promocion_id, tipo, contenido, canal, origen,
        fecha_hora_envio, es_recurrente, dias_recurrencia)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      negocioId,
      datos.usuarioId || null,
      datos.productoId || null,
      datos.promocionId || null,
      datos.tipo,
      datos.contenido,
      datos.canal || "ambos",
      datos.origen || "manual",
      datos.fechaHoraEnvio,
      Boolean(datos.esRecurrente),
      datos.diasRecurrencia || null,
    ]
  );
  return rows[0];
}

async function listarPorNegocio(negocioId, estado) {
  if (estado) {
    const { rows } = await pool.query(
      "SELECT * FROM mensajes WHERE negocio_id = $1 AND estado = $2 ORDER BY fecha_hora_envio DESC",
      [negocioId, estado]
    );
    return rows;
  }
  const { rows } = await pool.query(
    "SELECT * FROM mensajes WHERE negocio_id = $1 ORDER BY fecha_hora_envio DESC",
    [negocioId]
  );
  return rows;
}

async function buscarPorId(negocioId, mensajeId) {
  const { rows } = await pool.query(
    "SELECT * FROM mensajes WHERE id = $1 AND negocio_id = $2",
    [mensajeId, negocioId]
  );
  return rows[0];
}

async function actualizarEstado(mensajeId, estado) {
  const { rows } = await pool.query(
    "UPDATE mensajes SET estado = $1 WHERE id = $2 RETURNING *",
    [estado, mensajeId]
  );
  return rows[0];
}

async function listarParaPantalla(negocioId) {
  const { rows } = await pool.query(
    `SELECT * FROM mensajes
     WHERE negocio_id = $1 AND canal IN ('pantalla', 'ambos') AND estado = 'enviado'
     ORDER BY fecha_hora_envio DESC
     LIMIT 20`,
    [negocioId]
  );
  return rows;
}

async function contarEnviadosHoy(negocioId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM envios_whatsapp ev
     JOIN mensajes m ON m.id = ev.mensaje_id
     WHERE m.negocio_id = $1 AND ev.estado = 'enviado' AND ev.fecha_envio >= date_trunc('day', now())`,
    [negocioId]
  );
  return rows[0].total;
}

module.exports = {
  crear,
  listarPorNegocio,
  buscarPorId,
  actualizarEstado,
  listarParaPantalla,
  contarEnviadosHoy,
};
