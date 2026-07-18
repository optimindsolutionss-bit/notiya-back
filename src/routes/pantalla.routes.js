const { Router } = require("express");
const controlador = require("../controllers/pantalla.controller");

const router = Router();

router.get("/:negocioId", controlador.obtener);

module.exports = router;
