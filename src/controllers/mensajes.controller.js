const mensajesRepo = require("../repositories/mensajes.repository");
const mensajesService = require("../services/mensajes.service");

async function crear(req, res) {
  try {
    const { productoId, promocionId, tipo, contenido, canal, fechaHoraEnvio, esRecurrente, diasRecurrencia } = req.body;
    if (!tipo || !contenido) {
      return res.status(400).json({ mensaje: "tipo y contenido son obligatorios" });
    }
    const fechaEnvio = fechaHoraEnvio ? new Date(fechaHoraEnvio) : new Date();
    const mensaje = await mensajesRepo.crear(req.negocioId, {
      usuarioId: req.usuario.id,
      productoId,
      promocionId,
      tipo,
      contenido,
      canal,
      origen: "manual",
      fechaHoraEnvio: fechaEnvio,
      esRecurrente,
      diasRecurrencia,
    });

    if (fechaEnvio <= new Date()) {
      await mensajesService.generarEnviosParaMensaje(mensaje.id, req.negocioId);
    }

    const mensajeActualizado = await mensajesRepo.buscarPorId(req.negocioId, mensaje.id);
    return res.status(201).json({ mensaje: "Mensaje creado", data: mensajeActualizado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function listar(req, res) {
  try {
    const mensajes = await mensajesRepo.listarPorNegocio(req.negocioId, req.query.estado);
    return res.json({ mensajes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function cancelar(req, res) {
  try {
    const mensaje = await mensajesRepo.buscarPorId(req.negocioId, req.params.mensajeId);
    if (!mensaje) {
      return res.status(404).json({ mensaje: "Mensaje no encontrado" });
    }
    if (mensaje.estado !== "pendiente") {
      return res.status(409).json({ mensaje: "Solo se pueden cancelar mensajes pendientes" });
    }
    const actualizado = await mensajesRepo.actualizarEstado(mensaje.id, "cancelado");
    return res.json({ mensaje: "Mensaje cancelado", data: actualizado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { crear, listar, cancelar };
