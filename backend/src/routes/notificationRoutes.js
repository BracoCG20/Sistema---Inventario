const { Router } = require("express");
const router = Router();
const multer = require("multer");
const {
	enviarCorreoEntrega,
} = require("../controllers/notificationController");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/enviar-correo", upload.single("pdf"), enviarCorreoEntrega);

module.exports = router;
