const { Router } = require("express");
const { verificarToken, verificarAccesoNegocio } = require("../middlewares/auth.middleware");
const controlador = require("../controllers/plantillas.controller");

const router = Router({ mergeParams: true });

router.use(verificarToken);
router.use(verificarAccesoNegocio());

router.post("/", controlador.crear);
router.get("/", controlador.listar);
router.put("/:plantillaId", controlador.actualizar);
router.delete("/:plantillaId", controlador.eliminar);

module.exports = router;
