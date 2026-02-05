const db = require('../config/db');

// --- 1. REGISTRAR ENTREGA (Salida de equipo) ---
const registrarEntrega = async (req, res) => {
  const { equipo_id, empleado_id, fecha, cargador, observaciones } = req.body;

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // A. Verificar si el equipo está disponible
    const checkEquipo = await client.query(
      'SELECT disponible FROM equipos WHERE id = $1',
      [equipo_id],
    );

    if (checkEquipo.rows.length === 0) {
      throw new Error('Equipo no encontrado');
    }
    // Validamos que exista la propiedad disponible (si es null, asumimos true o false según lógica, pero mejor validar)
    if (checkEquipo.rows[0].disponible === false) {
      throw new Error('El equipo ya está asignado a otra persona');
    }

    // B. Registrar el movimiento
    // CORRECCIÓN AQUÍ: Cambiamos 'type' por 'tipo'
    const insertMov = `
            INSERT INTO movimientos 
            (equipo_id, empleado_id, tipo, fecha_movimiento, cargador_incluido, observaciones, estado_equipo_momento)
            VALUES ($1, $2, 'entrega', $3, $4, $5, 'operativo')
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
    await client.query('UPDATE equipos SET disponible = false WHERE id = $1', [
      equipo_id,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Entrega registrada con éxito',
      movimiento_id: movResult.rows[0].id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(400).json({ error: error.message || 'Error en la transacción' });
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
    await client.query('BEGIN');

    // CORRECCIÓN AQUÍ: Cambiamos 'type' por 'tipo'
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

    // B. Liberar el equipo (Disponible = true) y actualizar su estado físico
    await client.query(
      'UPDATE equipos SET disponible = true, estado = $1 WHERE id = $2',
      [estado_final, equipo_id],
    );

    await client.query('COMMIT');

    res.status(201).json({ message: 'Devolución registrada correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error al registrar devolución' });
  } finally {
    client.release();
  }
};

module.exports = { registrarEntrega, registrarDevolucion };
