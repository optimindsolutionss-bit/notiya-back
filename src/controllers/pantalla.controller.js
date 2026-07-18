const negociosRepo = require("../repositories/negocios.repository");
const productosRepo = require("../repositories/productos.repository");
const promocionesRepo = require("../repositories/promociones.repository");
const mensajesRepo = require("../repositories/mensajes.repository");

async function obtener(req, res) {
  try {
    const negocioId = Number(req.params.negocioId);
    const negocio = await negociosRepo.buscarPorId(negocioId);
    if (!negocio || !negocio.activo) {
      return res.status(404).json({ mensaje: "Negocio no encontrado" });
    }
    const [productos, promociones, avisos] = await Promise.all([
      productosRepo.listarPorNegocio(negocioId),
      promocionesRepo.listarActivas(negocioId),
      mensajesRepo.listarParaPantalla(negocioId),
    ]);
    return res.json({
      negocio: {
        nombre: negocio.nombre,
        logoUrl: negocio.logo_url,
        descripcion: negocio.descripcion,
      },
      productos: productos.filter((p) => p.disponible),
      promociones,
      avisos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error del servidor" });
  }
}

module.exports = { obtener };
