const db = require("../config/db");

// 1. Obtener todos los usuarios (empleados) + Quién los creó + Empresa del creador
const getUsuarios = async (req, res) => {
	try {
		const query = `
      SELECT e.*, 
             ua.nombre as creador_nombre, 
             ua.email as creador_email,
             ua.empresa as creador_empresa  -- <--- AGREGAMOS ESTA LÍNEA
      FROM empleados e
      LEFT JOIN usuarios_admin ua ON e.creado_por_id = ua.id
      ORDER BY e.nombres ASC
    `;
		const response = await db.query(query);
		res.status(200).json(response.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener usuarios" });
	}
};

// 2. Crear usuario
const createUsuario = async (req, res) => {
	const creadoPor = req.user ? req.user.id : null;
	const { dni, nombres, apellidos, correo, empresa, cargo, genero, telefono } =
		req.body;

	try {
		const newUser = await db.query(
			"INSERT INTO empleados (dni, nombres, apellidos, correo, empresa, cargo, genero, telefono, creado_por_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
			[
				dni,
				nombres,
				apellidos,
				correo,
				empresa,
				cargo,
				genero,
				telefono,
				creadoPor,
			],
		);
		res.json(newUser.rows[0]);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al crear usuario" });
	}
};

// 3. Actualizar usuario
const updateUsuario = async (req, res) => {
	const { id } = req.params;
	const { dni, nombres, apellidos, correo, empresa, cargo, genero, telefono } =
		req.body;

	try {
		const result = await db.query(
			"UPDATE empleados SET dni=$1, nombres=$2, apellidos=$3, correo=$4, empresa=$5, cargo=$6, genero=$7, telefono=$8 WHERE id=$9 RETURNING *",
			[dni, nombres, apellidos, correo, empresa, cargo, genero, telefono, id],
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}

		res.json({
			message: "Usuario actualizado correctamente",
			usuario: result.rows[0],
		});
	} catch (error) {
		console.error("Error SQL:", error.message);
		res.status(500).json({ error: "Error al actualizar usuario" });
	}
};

// 4. Eliminar (Dar de Baja / Inactivar)
const deleteUsuario = async (req, res) => {
	const { id } = req.params;
	try {
		const result = await db.query(
			"UPDATE empleados SET activo = false WHERE id = $1 RETURNING *",
			[id],
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}

		res.json({ message: "Usuario dado de baja correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al desactivar usuario" });
	}
};

// 5. NUEVO: Activar Usuario (Reactivar)
const activateUsuario = async (req, res) => {
	const { id } = req.params;
	try {
		const result = await db.query(
			"UPDATE empleados SET activo = true WHERE id = $1 RETURNING *",
			[id],
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}

		res.json({ message: "Usuario reactivado correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al reactivar usuario" });
	}
};

module.exports = {
	getUsuarios,
	createUsuario,
	updateUsuario,
	deleteUsuario,
	activateUsuario, // <--- Exportamos la nueva función
};
