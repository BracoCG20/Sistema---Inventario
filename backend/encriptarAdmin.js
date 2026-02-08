const db = require("./src/config/db");
const bcrypt = require("bcryptjs");

const updatePassword = async () => {
	// 1. Encriptamos 'admin123'
	const salt = await bcrypt.genSalt(10);
	const hash = await bcrypt.hash("admin123", salt);

	// 2. Actualizamos el usuario admin en la DB
	try {
		await db.query(
			"UPDATE usuarios_admin SET password_hash = $1 WHERE email = $2",
			[hash, "cbraco@sistema.com"],
		);
		console.log("✅ Contraseña de Admin actualizada a formato seguro (Hash).");
		process.exit();
	} catch (error) {
		console.error(error);
	}
};

updatePassword();
