const { Router } = require("express");
const { verificarToken, verificarAccesoNegocio } = require("../middlewares/auth.middleware");
const controlador = require("../controllers/promociones.controller");

const router = Router({ mergeParams: true });

router.use(verificarToken);
router.use(verificarAccesoNegocio(["dueño", "editor", "promotor"]));

router.post("/", controlador.crear);
router.get("/", controlador.listar);
router.put("/:promocionId", controlador.actualizar);
router.delete("/:promocionId", controlador.eliminar);

module.exports = router;
