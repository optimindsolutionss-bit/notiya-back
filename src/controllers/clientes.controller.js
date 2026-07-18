const clientesRepo = require("../repositories/clientes.repository");

async function suscribirse(req, res) {
  try {
    const negocioId = Number(req.params.negocioId);
    const { nombre, whatsappNumero } = req.body;
    if (!negocioId) {
      return res.status(400).json({ mensaje: "negocioId inválido" });
    }
    if (!whatsappNumero) {
      return res.status(400).json({ mensaje: "whatsappNumero es obligatorio" });
    }
    const cliente = await clientesRepo.obtenerOCrear({ nombre, whatsappNumero });
    const suscripcion = await clientesRepo.suscribir(cliente.id, negocioId);
    return res.status(201).json({ mensaje: "Suscripción registrada", cliente, suscripcion });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function listar(req, res) {
  try {
    const clientes = await clientesRepo.listarSuscritos(req.negocioId);
    return res.json({ clientes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function darDeBaja(req, res) {
  try {
    const suscripcion = await clientesRepo.darDeBaja(req.params.clienteId, req.negocioId);
    if (!suscripcion) {
      return res.status(404).json({ mensaje: "Suscripción no encontrada" });
    }
    return res.json({ mensaje: "Cliente dado de baja", suscripcion });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { suscribirse, listar, darDeBaja };
