const db = require("../config/db");

const getClientes = async (req, res) => {
	try {
		// Traemos solo clientes activos
		const response = await db.query(
			"SELECT * FROM clientes WHERE activo = true ORDER BY nombre_completo ASC",
		);
		res.json(response.rows);
	} catch (error) {
		res.status(500).json({ error: "Error al cargar clientes" });
	}
};

module.exports = { getClientes };
