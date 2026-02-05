const db = require('../config/db');

const getHistorial = async (req, res) => {
  try {
    // Hacemos INNER JOIN para traer los nombres en lugar de solo IDs
    const query = `
            SELECT 
                m.id,
                m.tipo,               -- 'entrega' o 'devolucion'
                m.fecha_movimiento,
                m.observaciones,
                e.marca,
                e.modelo,
                e.serie,
                emp.nombres as empleado_nombre,
                emp.apellidos as empleado_apellido,
                emp.empresa
            FROM movimientos m
            JOIN equipos e ON m.equipo_id = e.id
            JOIN empleados emp ON m.empleado_id = emp.id
            ORDER BY m.fecha_movimiento DESC
        `;

    const response = await db.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el historial' });
  }
};

module.exports = { getHistorial };
