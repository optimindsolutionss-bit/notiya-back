const { Router } = require("express");
const { verificarToken, verificarAccesoNegocio } = require("../middlewares/auth.middleware");
const controlador = require("../controllers/mensajes.controller");

const router = Router({ mergeParams: true });

router.use(verificarToken);
router.use(verificarAccesoNegocio());

router.post("/", controlador.crear);
router.get("/", controlador.listar);
router.patch("/:mensajeId/cancelar", controlador.cancelar);

module.exports = router;
