const db = require("../config/db");

// 1. Obtener todos los equipos + Quién los registró
const getEquipos = async (req, res) => {
	try {
		const query = `
      SELECT e.*, 
             ua.nombre as creador_nombre, 
             ua.email as creador_email
      FROM equipos e
      LEFT JOIN usuarios_admin ua ON e.creado_por_id = ua.id
      ORDER BY e.created_at DESC
    `;
		const response = await db.query(query);
		res.status(200).json(response.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener equipos" });
	}
};

// 2. Crear un nuevo equipo
const createEquipo = async (req, res) => {
	// Obtenemos el ID del admin creador
	const creadoPor = req.user ? req.user.id : null;

	const { marca, modelo, serie, estado, especificaciones, fecha_compra } =
		req.body;

	try {
		const checkSerie = await db.query(
			"SELECT * FROM equipos WHERE serie = $1",
			[serie],
		);
		if (checkSerie.rows.length > 0) {
			return res.status(400).json({ error: "El número de serie ya existe." });
		}

		const newEquipo = await db.query(
			`INSERT INTO equipos (marca, modelo, serie, estado, especificaciones, fecha_compra, creado_por_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
			[
				marca,
				modelo,
				serie,
				estado || "operativo",
				especificaciones,
				fecha_compra || null,
				creadoPor, // Guardamos el ID del creador
			],
		);

		res.status(201).json({
			message: "Equipo registrado correctamente",
			equipo: newEquipo.rows[0],
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al crear el equipo" });
	}
};

// 3. Actualizar Equipo
const updateEquipo = async (req, res) => {
	const { id } = req.params;
	const { marca, modelo, serie, estado, especificaciones, fecha_compra } =
		req.body;

	try {
		await db.query(
			"UPDATE equipos SET marca=$1, modelo=$2, serie=$3, estado=$4, especificaciones=$5, fecha_compra=$6 WHERE id=$7",
			[
				marca,
				modelo,
				serie,
				estado,
				especificaciones,
				fecha_compra || null,
				id,
			],
		);
		res.json({ message: "Equipo actualizado" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al actualizar equipo" });
	}
};

// 4. Eliminar Equipo
const deleteEquipo = async (req, res) => {
	const { id } = req.params;
	try {
		await db.query("DELETE FROM equipos WHERE id = $1", [id]);
		res.json({ message: "Equipo eliminado" });
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: "No se puede eliminar (probablemente tiene historial asociado)",
		});
	}
};

module.exports = { getEquipos, createEquipo, updateEquipo, deleteEquipo };
