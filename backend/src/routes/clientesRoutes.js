const { Router } = require("express");
const router = Router();
const { getClientes } = require("../controllers/clientesController");
// Agregar verifyToken si usas autenticación
router.get("/", getClientes);
module.exports = router;
