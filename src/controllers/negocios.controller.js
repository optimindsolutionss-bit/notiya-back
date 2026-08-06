const negociosRepo = require("../repositories/negocios.repository");
const negocioUsuariosRepo = require("../repositories/negocioUsuarios.repository");
const usuariosRepo = require("../repositories/usuarios.repository");

const PALETAS_VALIDAS = ["medianoche", "oceano", "bosque", "ambar", "claro-clasico", "arena"];

async function crear(req, res) {
  try {
    const { nombre, tipoNegocio, direccion, telefonoContacto, correoContacto } = req.body;
    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre del negocio es obligatorio" });
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
      usuarioId: req.usuario.id,
      rol: "dueño",
    });
    return res.status(201).json({ mensaje: "Negocio creado", negocio });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function listarMios(req, res) {
  try {
    const negocios = await negociosRepo.listarPorUsuario(req.usuario.id);
    return res.json({ negocios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function obtener(req, res) {
  try {
    const negocio = await negociosRepo.buscarPorId(req.negocioId);
    return res.json({ negocio });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    if (req.rolNegocio !== "dueño") {
      return res.status(403).json({ mensaje: "Solo el dueño puede editar el negocio" });
    }
    if (req.body.paletaPantalla !== undefined && !PALETAS_VALIDAS.includes(req.body.paletaPantalla)) {
      return res.status(400).json({ mensaje: "paletaPantalla inválida" });
    }
    const mapaCampos = {
      nombre: "nombre",
      tipoNegocio: "tipo_negocio",
      logoUrl: "logo_url",
      descripcion: "descripcion",
      direccion: "direccion",
      telefonoContacto: "telefono_contacto",
      correoContacto: "correo_contacto",
      horaSilencioInicio: "hora_silencio_inicio",
      horaSilencioFin: "hora_silencio_fin",
      limiteEnviosDia: "limite_envios_dia",
      activo: "activo",
      paletaPantalla: "paleta_pantalla",
    };
    const campos = {};
    for (const [campoBody, columna] of Object.entries(mapaCampos)) {
      if (req.body[campoBody] !== undefined) campos[columna] = req.body[campoBody];
    }
    const negocio = await negociosRepo.actualizarNegocio(req.negocioId, campos);
    return res.json({ mensaje: "Negocio actualizado", negocio });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function agregarEmpleado(req, res) {
  try {
    if (req.rolNegocio !== "dueño") {
      return res.status(403).json({ mensaje: "Solo el dueño puede agregar empleados" });
    }
    const { correo, rol } = req.body;
    if (!correo || !["dueño", "editor", "promotor"].includes(rol)) {
      return res.status(400).json({ mensaje: "correo y rol (dueño|editor|promotor) son obligatorios" });
    }
    const usuario = await usuariosRepo.buscarPorCorreo(correo);
    if (!usuario) {
      return res.status(404).json({ mensaje: "No existe un usuario con ese correo" });
    }
    const acceso = await negocioUsuariosRepo.agregarUsuario({
      negocioId: req.negocioId,
      usuarioId: usuario.id,
      rol,
    });
    return res.status(201).json({ mensaje: "Empleado agregado", acceso });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function listarEmpleados(req, res) {
  try {
    if (req.rolNegocio !== "dueño") {
      return res.status(403).json({ mensaje: "Solo el dueño puede ver el equipo" });
    }
    const empleados = await negocioUsuariosRepo.listarPorNegocio(req.negocioId);
    return res.json({ empleados });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function actualizarRolEmpleado(req, res) {
  try {
    if (req.rolNegocio !== "dueño") {
      return res.status(403).json({ mensaje: "Solo el dueño puede cambiar roles" });
    }
    const { rol } = req.body;
    if (!["dueño", "editor", "promotor"].includes(rol)) {
      return res.status(400).json({ mensaje: "rol debe ser dueño, editor o promotor" });
    }
    const usuarioId = Number(req.params.usuarioId);
    const acceso = await negocioUsuariosRepo.obtenerAcceso(req.negocioId, usuarioId);
    if (!acceso) {
      return res.status(404).json({ mensaje: "Ese usuario no tiene acceso a este negocio" });
    }
    if (acceso.rol === "dueño" && rol !== "dueño") {
      const totalDuenos = await negocioUsuariosRepo.contarDuenos(req.negocioId);
      if (totalDuenos <= 1) {
        return res.status(400).json({ mensaje: "El negocio debe tener al menos un dueño" });
      }
    }
    const actualizado = await negocioUsuariosRepo.actualizarRol({
      negocioId: req.negocioId,
      usuarioId,
      rol,
    });
    return res.json({ mensaje: "Rol actualizado", acceso: actualizado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function quitarEmpleado(req, res) {
  try {
    if (req.rolNegocio !== "dueño") {
      return res.status(403).json({ mensaje: "Solo el dueño puede quitar acceso" });
    }
    const usuarioId = Number(req.params.usuarioId);
    const acceso = await negocioUsuariosRepo.obtenerAcceso(req.negocioId, usuarioId);
    if (!acceso) {
      return res.status(404).json({ mensaje: "Ese usuario no tiene acceso a este negocio" });
    }
    if (acceso.rol === "dueño") {
      const totalDuenos = await negocioUsuariosRepo.contarDuenos(req.negocioId);
      if (totalDuenos <= 1) {
        return res.status(400).json({ mensaje: "El negocio debe tener al menos un dueño" });
      }
    }
    await negocioUsuariosRepo.eliminarUsuario({ negocioId: req.negocioId, usuarioId });
    return res.json({ mensaje: "Acceso eliminado" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function obtenerHorario(req, res) {
  try {
    if (req.rolNegocio !== "dueño") {
      return res.status(403).json({ mensaje: "Solo el dueño puede ver el horario" });
    }
    const horario = await negociosRepo.obtenerHorario(req.negocioId);
    return res.json({ horario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

async function actualizarHorario(req, res) {
  try {
    if (req.rolNegocio !== "dueño") {
      return res.status(403).json({ mensaje: "Solo el dueño puede editar el horario" });
    }
    const { dias } = req.body;
    if (!Array.isArray(dias)) {
      return res.status(400).json({ mensaje: "dias debe ser un arreglo" });
    }
    const horario = await negociosRepo.reemplazarHorario(req.negocioId, dias);
    return res.json({ mensaje: "Horario actualizado", horario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = {
  crear,
  listarMios,
  obtener,
  actualizar,
  agregarEmpleado,
  listarEmpleados,
  actualizarRolEmpleado,
  quitarEmpleado,
  obtenerHorario,
  actualizarHorario,
};
