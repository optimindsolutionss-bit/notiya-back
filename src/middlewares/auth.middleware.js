const jwt = require("jsonwebtoken");
const { obtenerAcceso } = require("../repositories/negocioUsuarios.repository");

function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization;
  if (!encabezado || !encabezado.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }
  const token = encabezado.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
}

function verificarAccesoNegocio(rolesPermitidos = ["dueño", "editor"]) {
  return async (req, res, next) => {
    const negocioId = Number(req.params.negocioId);
    if (!negocioId) {
      return res.status(400).json({ mensaje: "negocioId inválido" });
    }
    req.negocioId = negocioId;
    if (req.usuario.esSuperAdmin) {
      req.rolNegocio = "dueño";
      return next();
    }
    const acceso = await obtenerAcceso(negocioId, req.usuario.id);
    if (!acceso || !rolesPermitidos.includes(acceso.rol)) {
      return res.status(403).json({ mensaje: "No tienes acceso a este negocio" });
    }
    req.rolNegocio = acceso.rol;
    next();
  };
}

function verificarSuperAdmin(req, res, next) {
  if (!req.usuario?.esSuperAdmin) {
    return res.status(403).json({ mensaje: "Requiere permisos de super admin" });
  }
  next();
}

module.exports = { verificarToken, verificarAccesoNegocio, verificarSuperAdmin };
