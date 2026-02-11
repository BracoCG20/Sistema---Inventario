const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// --- 1. LOGIN ---
const login = async (req, res) => {
	const { email, password } = req.body;

	try {
		// 1. Buscar usuario por email
		const result = await pool.query(
			"SELECT * FROM usuarios_admin WHERE email = $1",
			[email],
		);

		if (result.rows.length === 0) {
			return res.status(400).json({ error: "Usuario no encontrado" });
		}

		const user = result.rows[0];

		// --- NUEVA VALIDACIÓN: Verificar si está activo ---
		if (!user.activo) {
			return res.status(403).json({
				error:
					"Acceso denegado: Tu cuenta está inactiva. Contacta al administrador.",
			});
		}
		// ------------------------------------------------

		// 2. Verificar contraseña
		if (!user.password_hash) {
			console.error("Error: Usuario sin hash de contraseña en BD");
			return res
				.status(500)
				.json({ error: "Error de integridad en datos de usuario" });
		}

		const validPassword = await bcrypt.compare(password, user.password_hash);

		if (!validPassword) {
			return res.status(400).json({ error: "Contraseña incorrecta" });
		}

		// 3. Generar Token
		const token = jwt.sign(
			{ id: user.id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: "8h" },
		);

		// 4. Responder
		res.json({
			token,
			user: {
				id: user.id,
				nombre: user.nombre,
				email: user.email, // Importante para que salga en el Sidebar
				foto_url: user.foto_url,
				cargo: user.cargo,
				rol_id: user.rol_id, // Opcional, por si lo necesitas en el frontend
			},
		});
	} catch (error) {
		console.error("Error en login:", error);
		res.status(500).json({ error: "Error en el servidor" });
	}
};

// --- 2. OBTENER PERFIL ---
const getPerfil = async (req, res) => {
	try {
		const id = req.user.id; // Viene del middleware verifyToken

		// SOLUCIÓN: Agregamos 'rol_id' al SELECT
		const query = `
            SELECT id, nombre, apellidos, nombre_usuario, email, empresa, cargo, foto_url, telefono, fecha_creacion, fecha_modificacion, rol_id 
            FROM usuarios_admin WHERE id = $1
        `;

		const result = await pool.query(query, [id]);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}

		res.json(result.rows[0]);
	} catch (error) {
		console.error("Error obteniendo perfil:", error);
		res.status(500).json({ error: "Error al obtener perfil" });
	}
};

// --- 3. ACTUALIZAR PERFIL ---
const updatePerfil = async (req, res) => {
	const id = req.user.id;
	const {
		nombre,
		apellidos,
		nombre_usuario,
		email,
		password, // El frontend envía la nueva contraseña aquí
		empresa,
		cargo,
		telefono,
	} = req.body;
	const file = req.file;

	const client = await pool.pool.connect();

	try {
		await client.query("BEGIN");

		// Construcción dinámica de la consulta SQL
		const fields = [];
		const values = [];
		let idx = 1;

		const addField = (col, val) => {
			fields.push(`${col} = $${idx}`);
			values.push(val);
			idx++;
		};

		// Campos de texto
		if (nombre) addField("nombre", nombre);
		if (apellidos) addField("apellidos", apellidos);
		if (nombre_usuario) addField("nombre_usuario", nombre_usuario);
		if (email) addField("email", email);
		if (empresa) addField("empresa", empresa);
		if (cargo) addField("cargo", cargo);
		if (telefono) addField("telefono", telefono);

		// Contraseña: Si viene texto, lo hasheamos y guardamos en 'password_hash'
		if (password && password.trim() !== "") {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(password, salt);
			addField("password_hash", hash); // <--- IMPORTANTE: Nombre exacto de tu columna
		}

		// Foto: Si se subió archivo, guardamos la URL
		if (file) {
			const fileUrl = `/uploads/${file.filename}`;
			addField("foto_url", fileUrl);
		}

		// Fecha modificación
		addField("fecha_modificacion", new Date());

		// Si no hay campos que actualizar
		if (fields.length === 0) {
			await client.query("ROLLBACK");
			return res.json({ message: "No hubo cambios para actualizar" });
		}

		const finalQuery = `UPDATE usuarios_admin SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, nombre, email, foto_url, cargo`;
		values.push(id);

		const result = await client.query(finalQuery, values);
		await client.query("COMMIT");

		res.json({
			message: "Perfil actualizado correctamente",
			user: result.rows[0],
		});
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Error actualizando perfil:", error);
		res.status(500).json({ error: "Error al actualizar perfil" });
	} finally {
		client.release();
	}
};

const register = async (req, res) => {
	// Recibimos 'rol_id' en lugar de 'rol'
	const {
		nombre,
		apellidos,
		email,
		password,
		cargo,
		empresa,
		telefono,
		rol_id,
	} = req.body;

	try {
		const userExist = await pool.query(
			"SELECT * FROM usuarios_admin WHERE email = $1",
			[email],
		);
		if (userExist.rows.length > 0) {
			return res.status(400).json({ error: "El correo ya está registrado" });
		}

		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(password, salt);

		// IMPORTANTE: Insertamos en 'rol_id'.
		// Asumo que si no envían rol_id, por defecto es 2 (según tu tabla).
		const rolFinal = rol_id || 2;

		const query = `
            INSERT INTO usuarios_admin 
            (nombre, apellidos, email, password_hash, cargo, empresa, telefono, rol_id, activo, fecha_creacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
            RETURNING id, nombre, email
        `;

		const values = [
			nombre,
			apellidos,
			email,
			hash,
			cargo,
			empresa,
			telefono,
			rolFinal,
		];
		const result = await pool.query(query, values);

		res.json({ message: "Usuario creado exitosamente", user: result.rows[0] });
	} catch (error) {
		console.error("Error en registro:", error);
		res.status(500).json({ error: "Error al registrar usuario" });
	}
};

// B. OBTENER TODOS LOS USUARIOS
const getAllUsers = async (req, res) => {
	try {
		// Hacemos LEFT JOIN con la tabla 'roles' para traer el nombre del rol.
		// Asumo que tu tabla 'roles' tiene una columna 'nombre' o 'descripcion'.
		// Si se llama diferente, cambia 'r.nombre' por lo que corresponda.
		const query = `
            SELECT 
                u.id, 
                u.nombre, 
                u.apellidos, 
                u.email, 
                u.cargo, 
                u.empresa, 
                u.activo, 
                u.rol_id,
                r.nombre as nombre_rol 
            FROM usuarios_admin u
            LEFT JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id ASC
        `;
		const result = await pool.query(query);
		res.json(result.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener usuarios" });
	}
};

// C. CAMBIAR ESTADO (ACTIVO/INACTIVO)
const toggleUserStatus = async (req, res) => {
	const { id } = req.params;
	const { activo } = req.body; // true o false

	try {
		await pool.query("UPDATE usuarios_admin SET activo = $1 WHERE id = $2", [
			activo,
			id,
		]);
		res.json({ message: "Estado actualizado correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al cambiar estado" });
	}
};

// D. CAMBIAR CONTRASEÑA (COMO ADMINISTRADOR)
const adminUpdatePassword = async (req, res) => {
	const { id } = req.params;
	const { newPassword } = req.body;

	try {
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(newPassword, salt);

		await pool.query(
			"UPDATE usuarios_admin SET password_hash = $1 WHERE id = $2",
			[hash, id],
		);
		res.json({ message: "Contraseña actualizada correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al cambiar contraseña" });
	}
};

// --- EXPORTACIÓN ---
module.exports = {
	login,
	getPerfil,
	updatePerfil,
	register,
	getAllUsers,
	toggleUserStatus,
	adminUpdatePassword,
};
