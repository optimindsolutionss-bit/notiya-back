const plantillasRepo = require("../repositories/plantillas.repository");

async function crear(req, res) {
  try {
    const { nombre, tipo, contenido } = req.body;
    if (!nombre || !tipo || !contenido) {
      return res.status(400).json({ mensaje: "nombre, tipo y contenido son obligatorios" });
    }
    const plantilla = await plantillasRepo.crear(req.negocioId, { nombre, tipo, contenido });
    return res.status(201).json({ mensaje: "Plantilla creada", plantilla });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function listar(req, res) {
  try {
    const plantillas = await plantillasRepo.listarPorNegocio(req.negocioId);
    return res.json({ plantillas });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    const camposPermitidos = ["nombre", "tipo", "contenido"];
    const campos = {};
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) campos[campo] = req.body[campo];
    }
    const plantilla = await plantillasRepo.actualizar(req.negocioId, req.params.plantillaId, campos);
    if (!plantilla) {
      return res.status(404).json({ mensaje: "Plantilla no encontrada" });
    }
    return res.json({ mensaje: "Plantilla actualizada", plantilla });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function eliminar(req, res) {
  try {
    const eliminada = await plantillasRepo.eliminar(req.negocioId, req.params.plantillaId);
    if (!eliminada) {
      return res.status(404).json({ mensaje: "Plantilla no encontrada" });
    }
    return res.json({ mensaje: "Plantilla eliminada" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { crear, listar, actualizar, eliminar };
