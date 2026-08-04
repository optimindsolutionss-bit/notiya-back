const negociosRepo = require("../repositories/negocios.repository");
const negocioUsuariosRepo = require("../repositories/negocioUsuarios.repository");
const usuariosRepo = require("../repositories/usuarios.repository");

async function listarNegocios(req, res) {
  try {
    const negocios = await negociosRepo.listarTodos();
    return res.json({ negocios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function crearNegocioParaUsuario(req, res) {
  try {
    const { usuarioId, nombre, tipoNegocio, direccion, telefonoContacto, correoContacto } = req.body;
    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre del negocio es obligatorio" });
    }
    if (!usuarioId) {
      return res.status(400).json({ mensaje: "usuarioId es obligatorio" });
    }
    const usuario = await usuariosRepo.buscarPorId(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: "No existe un usuario con ese id" });
    }
    const negocio = await negociosRepo.crearNegocio({
      nombre,
      tipoNegocio,
      direccion,
      telefonoContacto,
      correoContacto,
    });
    await negocioUsuariosRepo.agregarUsuario({
      negocioId: negocio.id,
      usuarioId,
      rol: "dueño",
    });
    return res.status(201).json({ mensaje: "Negocio creado", negocio });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function buscarUsuarios(req, res) {
  try {
    const { correo } = req.query;
    if (!correo) {
      return res.status(400).json({ mensaje: "El parámetro correo es obligatorio" });
    }
    const usuarios = await usuariosRepo.buscarPorCorreoParcial(correo);
    return res.json({ usuarios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { listarNegocios, crearNegocioParaUsuario, buscarUsuarios };
