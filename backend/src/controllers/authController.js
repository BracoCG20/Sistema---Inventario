const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
	const { email, password } = req.body;

	try {
		// 1. Buscar usuario Y su rol (JOIN)
		// Usamos alias: 'u' para usuarios_admin, 'r' para roles
		const result = await db.query(
			`SELECT u.id, u.nombre, u.email, u.password_hash, r.nombre as rol_nombre 
       FROM usuarios_admin u 
       JOIN roles r ON u.rol_id = r.id 
       WHERE u.email = $1 AND u.activo = true`,
			[email],
		);

		// Si no existe o está inactivo
		if (result.rows.length === 0) {
			return res
				.status(400)
				.json({ error: "Credenciales inválidas o usuario inactivo" });
		}

		const user = result.rows[0];

		// 2. Comparar contraseña
		// user.password_hash viene de la BD (encriptada)
		const validPassword = await bcrypt.compare(password, user.password_hash);

		if (!validPassword) {
			return res.status(400).json({ error: "Credenciales inválidas" });
		}

		// 3. Generar Token JWT con el ROL REAL
		const secret = process.env.JWT_SECRET || "palabra_secreta_super_segura";

		const token = jwt.sign(
			{
				id: user.id,
				role: user.rol_nombre, // <--- AQUÍ GUARDAMOS EL ROL ('admin', 'superadmin', etc.)
			},
			secret,
			{ expiresIn: "8h" },
		);

		// 4. Responder al Frontend
		res.json({
			message: `Bienvenido, ${user.nombre}`,
			token,
			user: {
				id: user.id,
				nombre: user.nombre,
				email: user.email,
				role: user.rol_nombre, // Enviamos el rol al frontend también
			},
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error en el servidor" });
	}
};

module.exports = { login };
