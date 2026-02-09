const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const {
	getUsuarios,
	createUsuario,
	updateUsuario,
	deleteUsuario,
	activateUsuario, // <--- Importamos
} = require("../controllers/usuariosController");

router.get("/", verifyToken, getUsuarios);
router.post("/", verifyToken, createUsuario);
router.put("/:id", verifyToken, updateUsuario);
router.delete("/:id", verifyToken, deleteUsuario);

// --- RUTA NUEVA ---
router.put("/:id/activate", verifyToken, activateUsuario);

module.exports = router;
