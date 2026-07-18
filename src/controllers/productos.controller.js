const productosRepo = require("../repositories/productos.repository");
const mensajesService = require("../services/mensajes.service");

async function crear(req, res) {
  try {
    const { categoriaId, nombre, descripcion, precio, imagenUrl } = req.body;
    if (!nombre || precio === undefined) {
      return res.status(400).json({ mensaje: "nombre y precio son obligatorios" });
    }
    const producto = await productosRepo.crear(req.negocioId, {
      categoriaId,
      nombre,
      descripcion,
      precio,
      imagenUrl,
    });
    return res.status(201).json({ mensaje: "Producto creado", producto });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function listar(req, res) {
  try {
    const productos = await productosRepo.listarPorNegocio(req.negocioId);
    return res.json({ productos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function obtener(req, res) {
  try {
    const producto = await productosRepo.buscarPorId(req.negocioId, req.params.productoId);
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    return res.json({ producto });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    const mapaCampos = {
      categoriaId: "categoria_id",
      nombre: "nombre",
      descripcion: "descripcion",
      precio: "precio",
      imagenUrl: "imagen_url",
    };
    const campos = {};
    for (const [campoBody, columna] of Object.entries(mapaCampos)) {
      if (req.body[campoBody] !== undefined) campos[columna] = req.body[campoBody];
    }
    const producto = await productosRepo.actualizar(req.negocioId, req.params.productoId, campos);
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    return res.json({ mensaje: "Producto actualizado", producto });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function actualizarDisponibilidad(req, res) {
  try {
    const { disponible } = req.body;
    if (typeof disponible !== "boolean") {
      return res.status(400).json({ mensaje: "disponible debe ser booleano" });
    }
    const producto = await productosRepo.actualizar(req.negocioId, req.params.productoId, {
      disponible,
    });
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    if (!disponible) {
      await mensajesService.alertaAgotado({
        negocioId: req.negocioId,
        producto,
        usuarioId: req.usuario.id,
      });
    }
    return res.json({ mensaje: "Disponibilidad actualizada", producto });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function eliminar(req, res) {
  try {
    const eliminado = await productosRepo.eliminar(req.negocioId, req.params.productoId);
    if (!eliminado) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }
    return res.json({ mensaje: "Producto eliminado" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { crear, listar, obtener, actualizar, actualizarDisponibilidad, eliminar };
