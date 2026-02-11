const db = require("../config/db");

const getHistorial = async (req, res) => {
	try {
		const query = `
      SELECT 
          m.*, 
          e.marca,
          e.modelo,
          e.serie,
          emp.nombres as empleado_nombre,
          emp.apellidos as empleado_apellido,
          emp.dni,                           
          emp.empresa as empleado_empresa,   
          ua.nombre as admin_nombre,         
          ua.email as admin_correo,          
          ua.empresa as admin_empresa,       
          AGE(CURRENT_TIMESTAMP, m.fecha_movimiento) as tiempo_uso 
      FROM movimientos m
      LEFT JOIN equipos e ON m.equipo_id = e.id
      LEFT JOIN empleados emp ON m.empleado_id = emp.id
      LEFT JOIN usuarios_admin ua ON m.registrado_por_id = ua.id
      ORDER BY m.fecha_movimiento DESC
    `;

		const response = await db.query(query);
		res.status(200).json(response.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener el historial" });
	}
};

module.exports = { getHistorial };
