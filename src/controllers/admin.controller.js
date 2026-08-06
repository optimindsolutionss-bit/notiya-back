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
      const usuarios = await usuariosRepo.listarTodos();
      return res.json({ usuarios });
    }
    const usuarios = await usuariosRepo.buscarPorCorreoParcial(correo);
    return res.json({ usuarios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function actualizarSuperAdmin(req, res) {
  try {
    const id = Number(req.params.id);
    if (id === req.usuario.id) {
      return res.status(400).json({ mensaje: "No puedes quitarte tu propio permiso de super admin" });
    }
    const { esSuperAdmin } = req.body;
    if (typeof esSuperAdmin !== "boolean") {
      return res.status(400).json({ mensaje: "esSuperAdmin debe ser booleano" });
    }
    const usuario = await usuariosRepo.actualizarSuperAdmin(id, esSuperAdmin);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    return res.json({ mensaje: "Usuario actualizado", usuario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { listarNegocios, crearNegocioParaUsuario, buscarUsuarios, actualizarSuperAdmin };
