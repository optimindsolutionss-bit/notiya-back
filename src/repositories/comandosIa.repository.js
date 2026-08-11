const pool = require("../config/db");

async function crear(negocioId, datos) {
  const { rows } = await pool.query(
    `INSERT INTO comandos_ia
       (negocio_id, usuario_id, texto_original, audio_url, producto_detectado_id,
        hora_detectada, accion_detectada, confianza, accion_tipo, accion_payload,
        requiere_confirmacion, respuesta_ia)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      negocioId,
      datos.usuarioId || null,
      datos.textoOriginal,
      datos.audioUrl || null,
      datos.productoDetectadoId || null,
      datos.horaDetectada || null,
      datos.accionDetectada || null,
      datos.confianza,
      datos.accionTipo || null,
      datos.accionPayload ? JSON.stringify(datos.accionPayload) : null,
      datos.requiereConfirmacion || false,
      datos.respuestaIA || null,
    ]
  );
  return rows[0];
}

async function vincularMensaje(comandoId, mensajeId) {
  const { rows } = await pool.query(
    "UPDATE comandos_ia SET mensaje_id = $1 WHERE id = $2 RETURNING *",
    [mensajeId, comandoId]
  );
  return rows[0];
}

async function actualizarEstado(comandoId, estado) {
  const { rows } = await pool.query(
    "UPDATE comandos_ia SET estado = $1 WHERE id = $2 RETURNING *",
    [estado, comandoId]
  );
  return rows[0];
}

async function buscarPorId(negocioId, comandoId) {
  const { rows } = await pool.query(
    "SELECT * FROM comandos_ia WHERE id = $1 AND negocio_id = $2",
    [comandoId, negocioId]
  );
  return rows[0];
}

async function listarPorNegocio(negocioId) {
  const { rows } = await pool.query(
    "SELECT * FROM comandos_ia WHERE negocio_id = $1 ORDER BY created_at DESC",
    [negocioId]
  );
  return rows;
}

module.exports = { crear, vincularMensaje, actualizarEstado, buscarPorId, listarPorNegocio };
