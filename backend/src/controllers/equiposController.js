const db = require("../config/db");

// 1. Obtener todos los equipos + Quién los registró + Antigüedad calculada
const getEquipos = async (req, res) => {
	try {
		const query = `
      SELECT e.*, 
             ua.nombre as creador_nombre, 
             ua.email as creador_email,
             ua.empresa as creador_empresa,
             -- Si tienes una columna 'actualizado_por_id', úsala aquí. 
             -- Por ahora usamos los datos de usuarios_admin para la auditoría
             ua.nombre as modificador_nombre, 
             ua.fecha_modificacion as fecha_modificacion_admin,
             -- Cálculo robusto de antigüedad
             AGE(CURRENT_DATE, COALESCE(e.fecha_compra, e.created_at)) as antiguedad_obj,
             COALESCE(
                (
                  SELECT m.observaciones 
                  FROM movimientos m 
                  WHERE m.equipo_id = e.id 
                    AND m.tipo = 'devolucion' 
                  ORDER BY m.fecha_movimiento DESC 
                  LIMIT 1
                ), 
              'Sin observaciones') as ultima_observacion
      FROM equipos e
      LEFT JOIN usuarios_admin ua ON e.creado_por_id = ua.id
      ORDER BY e.created_at DESC
    `;
		const response = await db.query(query);
		res.status(200).json(response.rows);
	} catch (error) {
		console.error("Error SQL:", error.message);
		res.status(500).json({ error: error.message });
	}
};
// 2. Crear un nuevo equipo
const createEquipo = async (req, res) => {
	const creadoPor = req.user ? req.user.id : null;
	// Nota: 'marca' aquí llega como el NOMBRE de la marca (string),
	// ya que el frontend se encarga de enviarlo así.
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
				marca, // Guardamos el nombre de la marca (relación lógica o FK si configuraste string)
				modelo,
				serie,
				estado || "operativo",
				especificaciones,
				fecha_compra || null,
				creadoPor,
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

// --- NUEVAS FUNCIONES PARA MARCAS ---

// 5. Obtener Marcas
const getMarcas = async (req, res) => {
	try {
		const response = await db.query("SELECT * FROM marcas ORDER BY nombre ASC");
		res.json(response.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al cargar marcas" });
	}
};

// 6. Crear Marca (Para el select Creatable)
const createMarca = async (req, res) => {
	const { nombre } = req.body;
	try {
		// Intentar insertar, si existe no hace nada (ON CONFLICT requiere constraint en BD)
		// O hacemos un check simple:
		const check = await db.query("SELECT * FROM marcas WHERE nombre = $1", [
			nombre.toUpperCase(),
		]);

		if (check.rows.length > 0) {
			return res.json(check.rows[0]); // Ya existe, la devolvemos
		}

		const newMarca = await db.query(
			"INSERT INTO marcas (nombre) VALUES ($1) RETURNING *",
			[nombre.toUpperCase()], // Guardamos siempre en mayúsculas
		);
		res.json(newMarca.rows[0]);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al crear marca" });
	}
};

module.exports = {
	getEquipos,
	createEquipo,
	updateEquipo,
	deleteEquipo,
	getMarcas,
	createMarca, // <--- Exportamos las nuevas
};
