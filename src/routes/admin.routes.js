const { Router } = require("express");
const { verificarToken, verificarSuperAdmin } = require("../middlewares/auth.middleware");
const controlador = require("../controllers/admin.controller");

const router = Router();

router.use(verificarToken, verificarSuperAdmin);

router.get("/negocios", controlador.listarNegocios);
router.post("/negocios", controlador.crearNegocioParaUsuario);
router.get("/usuarios", controlador.buscarUsuarios);
router.patch("/usuarios/:id/superadmin", controlador.actualizarSuperAdmin);

module.exports = router;
