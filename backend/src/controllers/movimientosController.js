const db = require("../config/db");

// --- 1. REGISTRAR ENTREGA (Salida de equipo) ---
const registrarEntrega = async (req, res) => {
	const { equipo_id, empleado_id, fecha, cargador, observaciones } = req.body;

	const client = await db.pool.connect();

	try {
		await client.query("BEGIN");

		// A. Verificar si el equipo está disponible
		const checkEquipo = await client.query(
			"SELECT disponible FROM equipos WHERE id = $1",
			[equipo_id],
		);

		if (checkEquipo.rows.length === 0) {
			throw new Error("Equipo no encontrado");
		}

		if (checkEquipo.rows[0].disponible === false) {
			throw new Error("El equipo ya está asignado a otra persona");
		}

		// B. Registrar el movimiento
		const insertMov = `
            INSERT INTO movimientos 
            (equipo_id, empleado_id, tipo, fecha_movimiento, cargador_incluido, observaciones)
            VALUES ($1, $2, 'entrega', $3, $4, $5)
            RETURNING id
        `;

		const movResult = await client.query(insertMov, [
			equipo_id,
			empleado_id,
			fecha,
			cargador,
			observaciones,
		]);

		// C. Actualizar el equipo a NO DISPONIBLE
		await client.query("UPDATE equipos SET disponible = false WHERE id = $1", [
			equipo_id,
		]);

		await client.query("COMMIT");

		res.status(201).json({
			message: "Entrega registrada con éxito",
			movimiento_id: movResult.rows[0].id,
		});
	} catch (error) {
		await client.query("ROLLBACK");
		console.error(error);
		res.status(400).json({ error: error.message || "Error en la transacción" });
	} finally {
		client.release();
	}
};

// --- 2. REGISTRAR DEVOLUCIÓN (Entrada de equipo) ---
const registrarDevolucion = async (req, res) => {
	const {
		equipo_id,
		empleado_id,
		fecha,
		cargador,
		observaciones,
		estado_final,
	} = req.body;

	const client = await db.pool.connect();

	try {
		await client.query("BEGIN");

		// A. Registrar el movimiento
		const insertMov = `
            INSERT INTO movimientos 
            (equipo_id, empleado_id, tipo, fecha_movimiento, cargador_incluido, observaciones, estado_equipo_momento)
            VALUES ($1, $2, 'devolucion', $3, $4, $5, $6)
        `;

		await client.query(insertMov, [
			equipo_id,
			empleado_id,
			fecha,
			cargador,
			observaciones,
			estado_final,
		]);

		// B. Liberar el equipo (disponible = true)
		await client.query(
			"UPDATE equipos SET disponible = true, estado = $1 WHERE id = $2",
			[estado_final, equipo_id],
		);

		await client.query("COMMIT");

		res.status(201).json({ message: "Devolución registrada correctamente" });
	} catch (error) {
		await client.query("ROLLBACK");
		console.error(error);
		res.status(500).json({ error: "Error al registrar devolución" });
	} finally {
		client.release();
	}
};

// --- 3. OBTENER HISTORIAL (CLAVE PARA QUE LOS FILTROS FUNCIONEN) ---
const obtenerHistorial = async (req, res) => {
	try {
		// Es vital que esta consulta devuelva empleado_id y equipo_id
		const query = `
            SELECT 
                m.id, 
                m.fecha_movimiento, 
                m.tipo, 
                m.cargador_incluido as cargador,
                m.observaciones,
                m.empleado_id,  -- ¡CRUCIAL!
                m.equipo_id,    -- ¡CRUCIAL!
                e.marca, 
                e.modelo, 
                e.serie, 
                emp.nombres as empleado_nombre, 
                emp.apellidos as empleado_apellido
            FROM movimientos m
            JOIN equipos e ON m.equipo_id = e.id
            JOIN empleados emp ON m.empleado_id = emp.id
            ORDER BY m.fecha_movimiento DESC
        `;
		const response = await db.query(query);
		res.json(response.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener historial" });
	}
};

module.exports = { registrarEntrega, registrarDevolucion, obtenerHistorial };
