const { Router } = require("express");
const { verificarToken, verificarAccesoNegocio } = require("../middlewares/auth.middleware");
const controlador = require("../controllers/clientes.controller");

const router = Router({ mergeParams: true });

router.post("/suscripcion", controlador.suscribirse);
router.get("/", verificarToken, verificarAccesoNegocio(), controlador.listar);
router.delete("/:clienteId", verificarToken, verificarAccesoNegocio(), controlador.darDeBaja);

module.exports = router;
