const categoriasRepo = require("../repositories/categorias.repository");

async function crear(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre es obligatorio" });
    }
    const categoria = await categoriasRepo.crear(req.negocioId, nombre);
    return res.status(201).json({ mensaje: "Categoría creada", categoria });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function listar(req, res) {
  try {
    const categorias = await categoriasRepo.listarPorNegocio(req.negocioId);
    return res.json({ categorias });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    const { nombre } = req.body;
    const categoria = await categoriasRepo.actualizar(req.negocioId, req.params.categoriaId, nombre);
    if (!categoria) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }
    return res.json({ mensaje: "Categoría actualizada", categoria });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function eliminar(req, res) {
  try {
    const eliminada = await categoriasRepo.eliminar(req.negocioId, req.params.categoriaId);
    if (!eliminada) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }
    return res.json({ mensaje: "Categoría eliminada" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { crear, listar, actualizar, eliminar };
