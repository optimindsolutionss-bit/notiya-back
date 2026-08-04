const { Router } = require("express");
const { verificarToken, verificarAccesoNegocio } = require("../middlewares/auth.middleware");
const controlador = require("../controllers/productos.controller");

const router = Router({ mergeParams: true });

router.use(verificarToken);
router.use(verificarAccesoNegocio(["dueño", "editor", "promotor"]));

router.post("/", controlador.crear);
router.get("/", controlador.listar);
router.get("/:productoId", controlador.obtener);
router.put("/:productoId", controlador.actualizar);
router.patch("/:productoId/disponibilidad", controlador.actualizarDisponibilidad);
router.delete("/:productoId", controlador.eliminar);

module.exports = router;
