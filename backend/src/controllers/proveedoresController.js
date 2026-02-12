const db = require('../config/db');
// 1. Obtener proveedores con conteo de equipos y auditoría
const getProveedores = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*, 
        u1.nombre as creador_nombre, 
        u2.nombre as modificador_nombre,
        -- Subconsulta para contar equipos alquilados
        (SELECT COUNT(*) FROM equipos e WHERE e.proveedor_id = p.id) as total_equipos
      FROM proveedores p
      LEFT JOIN usuarios_admin u1 ON p.created_by_id = u1.id
      LEFT JOIN usuarios_admin u2 ON p.updated_by_id = u2.id
      ORDER BY p.activo DESC, p.razon_social ASC
    `;
    const response = await db.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al cargar proveedores' });
  }
};
// 2. Crear un nuevo proveedor
const createProveedor = async (req, res) => {
  const usuarioId = req.user ? req.user.id : null;
  const { razon_social, ruc, email, telefono, nombre_contacto, direccion } =
    req.body;

  try {
    // Validar RUC duplicado
    const check = await db.query('SELECT * FROM proveedores WHERE ruc = $1', [
      ruc,
    ]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'El RUC ya está registrado.' });
    }

    const query = `
      INSERT INTO proveedores 
      (razon_social, ruc, email, telefono, nombre_contacto, direccion, created_by_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      razon_social,
      ruc,
      email,
      telefono,
      nombre_contacto,
      direccion,
      usuarioId,
    ];
    const newProv = await db.query(query, values);

    res
      .status(201)
      .json({ message: 'Proveedor registrado', proveedor: newProv.rows[0] });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error interno al registrar proveedor' });
  }
};

// 3. Actualizar Proveedor
const updateProveedor = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;
  const { razon_social, ruc, email, telefono, nombre_contacto, direccion } =
    req.body;

  try {
    const query = `
      UPDATE proveedores SET 
        razon_social=$1, ruc=$2, email=$3, telefono=$4, nombre_contacto=$5, direccion=$6, 
        updated_at=NOW(), updated_by_id=$7
      WHERE id=$8 RETURNING *
    `;
    const values = [
      razon_social,
      ruc,
      email,
      telefono,
      nombre_contacto,
      direccion,
      usuarioId,
      id,
    ];
    const result = await db.query(query, values);

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Proveedor no encontrado' });

    res.json({ message: 'Proveedor actualizado', proveedor: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

// 4. Baja Lógica de Proveedor
const deleteProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE proveedores SET activo = false WHERE id = $1', [id]);
    res.json({ message: 'Proveedor desactivado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

// 5. NUEVO: Reactivar Proveedor
const activateProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE proveedores SET activo = true WHERE id = $1', [id]);
    res.json({ message: 'Proveedor reactivado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al activar' });
  }
};

module.exports = {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  activateProveedor, // Exportar nueva función
};
