const promocionesRepo = require("../repositories/promociones.repository");

async function crear(req, res) {
  try {
    const { productoId, titulo, descripcion, precioPromocional, fechaInicio, fechaFin } = req.body;
    if (!titulo || !fechaInicio || !fechaFin) {
      return res.status(400).json({ mensaje: "titulo, fechaInicio y fechaFin son obligatorios" });
    }
    const promocion = await promocionesRepo.crear(req.negocioId, {
      productoId,
      titulo,
      descripcion,
      precioPromocional,
      fechaInicio,
      fechaFin,
    });
    return res.status(201).json({ mensaje: "Promoción creada", promocion });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function listar(req, res) {
  try {
    const promociones = req.query.activas === "true"
      ? await promocionesRepo.listarActivas(req.negocioId)
      : await promocionesRepo.listarPorNegocio(req.negocioId);
    return res.json({ promociones });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    const mapaCampos = {
      productoId: "producto_id",
      titulo: "titulo",
      descripcion: "descripcion",
      precioPromocional: "precio_promocional",
      fechaInicio: "fecha_inicio",
      fechaFin: "fecha_fin",
      activo: "activo",
    };
    const campos = {};
    for (const [campoBody, columna] of Object.entries(mapaCampos)) {
      if (req.body[campoBody] !== undefined) campos[columna] = req.body[campoBody];
    }
    const promocion = await promocionesRepo.actualizar(req.negocioId, req.params.promocionId, campos);
    if (!promocion) {
      return res.status(404).json({ mensaje: "Promoción no encontrada" });
    }
    return res.json({ mensaje: "Promoción actualizada", promocion });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function eliminar(req, res) {
  try {
    const eliminada = await promocionesRepo.eliminar(req.negocioId, req.params.promocionId);
    if (!eliminada) {
      return res.status(404).json({ mensaje: "Promoción no encontrada" });
    }
    return res.json({ mensaje: "Promoción eliminada" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { crear, listar, actualizar, eliminar };
