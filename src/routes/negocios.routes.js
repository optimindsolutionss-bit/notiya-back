const { Router } = require("express");
const { verificarToken, verificarAccesoNegocio } = require("../middlewares/auth.middleware");
const controlador = require("../controllers/negocios.controller");
const categoriasRoutes = require("./categorias.routes");
const productosRoutes = require("./productos.routes");
const promocionesRoutes = require("./promociones.routes");
const plantillasRoutes = require("./plantillas.routes");
const clientesRoutes = require("./clientes.routes");
const mensajesRoutes = require("./mensajes.routes");
const comandosIaRoutes = require("./comandosIa.routes");

const router = Router();

router.use("/:negocioId/clientes", clientesRoutes);

router.use(verificarToken);

router.post("/", controlador.crear);
router.get("/", controlador.listarMios);
router.get("/:negocioId", verificarAccesoNegocio(), controlador.obtener);
router.put("/:negocioId", verificarAccesoNegocio(), controlador.actualizar);
router.post("/:negocioId/empleados", verificarAccesoNegocio(), controlador.agregarEmpleado);
router.get("/:negocioId/empleados", verificarAccesoNegocio(), controlador.listarEmpleados);
router.put("/:negocioId/empleados/:usuarioId", verificarAccesoNegocio(), controlador.actualizarRolEmpleado);
router.delete("/:negocioId/empleados/:usuarioId", verificarAccesoNegocio(), controlador.quitarEmpleado);
router.get("/:negocioId/horarios", verificarAccesoNegocio(), controlador.obtenerHorario);
router.put("/:negocioId/horarios", verificarAccesoNegocio(), controlador.actualizarHorario);

router.use("/:negocioId/categorias", categoriasRoutes);
router.use("/:negocioId/productos", productosRoutes);
router.use("/:negocioId/promociones", promocionesRoutes);
router.use("/:negocioId/plantillas", plantillasRoutes);
router.use("/:negocioId/mensajes", mensajesRoutes);
router.use("/:negocioId/comandos", comandosIaRoutes);

module.exports = router;
