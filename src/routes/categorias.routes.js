const { Router } = require("express");
const { verificarToken, verificarAccesoNegocio } = require("../middlewares/auth.middleware");
const controlador = require("../controllers/categorias.controller");

const router = Router({ mergeParams: true });

router.use(verificarToken);
router.use(verificarAccesoNegocio());

router.post("/", controlador.crear);
router.get("/", controlador.listar);
router.put("/:categoriaId", controlador.actualizar);
router.delete("/:categoriaId", controlador.eliminar);

module.exports = router;
