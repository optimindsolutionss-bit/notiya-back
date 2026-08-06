const { Router } = require("express");
const { verificarToken, verificarAccesoNegocio } = require("../middlewares/auth.middleware");
const controlador = require("../controllers/comandosIa.controller");

const router = Router({ mergeParams: true });

router.use(verificarToken);
router.use(verificarAccesoNegocio());

router.post("/", controlador.crear);
router.get("/", controlador.listar);
router.patch("/:comandoId/confirmar", controlador.confirmar);
router.patch("/:comandoId/descartar", controlador.descartar);

module.exports = router;
