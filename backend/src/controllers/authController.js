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

		// 2. Verificar contraseña
		// IMPORTANTE: Usamos 'password_hash' que es como se llama en tu BD
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
				email: user.email,
				foto_url: user.foto_url,
				cargo: user.cargo,
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

		const query = `
            SELECT id, nombre, apellidos, nombre_usuario, email, empresa, cargo, foto_url, telefono, fecha_creacion, fecha_modificacion 
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
	const { nombre, apellidos, email, password, cargo, empresa, telefono } =
		req.body;

	try {
		// 1. Validar si el usuario ya existe
		const userExist = await pool.query(
			"SELECT * FROM usuarios_admin WHERE email = $1",
			[email],
		);
		if (userExist.rows.length > 0) {
			return res.status(400).json({ error: "El correo ya está registrado" });
		}

		// 2. Encriptar contraseña
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(password, salt);

		// 3. Insertar en Base de Datos
		const query = `
            INSERT INTO usuarios_admin (nombre, apellidos, email, password_hash, cargo, empresa, telefono, fecha_creacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id, nombre, email
        `;

		const values = [nombre, apellidos, email, hash, cargo, empresa, telefono];
		const result = await pool.query(query, values);

		res.json({
			message: "Usuario administrador creado exitosamente",
			user: result.rows[0],
		});
	} catch (error) {
		console.error("Error en registro:", error);
		res.status(500).json({ error: "Error al registrar usuario" });
	}
};

// --- EXPORTACIÓN ---
module.exports = {
	login,
	getPerfil,
	updatePerfil,
	register,
};
