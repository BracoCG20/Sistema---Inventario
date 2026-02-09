const db = require('../config/db');

// 1. Obtener Empresas (Se mantiene igual)
const getEmpresas = async (req, res) => {
  try {
    const query = `
            SELECT e.*, 
                   uc.nombre as creador_nombre, 
                   uu.nombre as editor_nombre
            FROM empresas e
            LEFT JOIN usuarios_admin uc ON e.created_by_id = uc.id
            LEFT JOIN usuarios_admin uu ON e.updated_by_id = uu.id
            ORDER BY e.razon_social ASC
        `;
    const response = await db.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar empresas' });
  }
};

// 2. Crear Empresa (ACTUALIZADO con Distrito y Provincia)
const createEmpresa = async (req, res) => {
  // Agregamos distrito y provincia al desestructurar
  const {
    razon_social,
    ruc,
    direccion,
    distrito,
    provincia,
    telefono,
    email_contacto,
    sitio_web,
  } = req.body;
  const createdBy = req.user ? req.user.id : null;

  try {
    const check = await db.query('SELECT * FROM empresas WHERE ruc = $1', [
      ruc,
    ]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'El RUC ya está registrado.' });
    }

    const newEmpresa = await db.query(
      `INSERT INTO empresas (razon_social, ruc, direccion, distrito, provincia, telefono, email_contacto, sitio_web, created_by_id, updated_by_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING *`,
      [
        razon_social,
        ruc,
        direccion,
        distrito,
        provincia,
        telefono,
        email_contacto,
        sitio_web,
        createdBy,
      ],
    );
    res
      .status(201)
      .json({
        message: 'Empresa registrada exitosamente',
        empresa: newEmpresa.rows[0],
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear empresa' });
  }
};

// 3. Actualizar Empresa (ACTUALIZADO con Distrito y Provincia)
const updateEmpresa = async (req, res) => {
  const { id } = req.params;
  const {
    razon_social,
    ruc,
    direccion,
    distrito,
    provincia,
    telefono,
    email_contacto,
    sitio_web,
  } = req.body;
  const updatedBy = req.user ? req.user.id : null;

  try {
    const result = await db.query(
      `UPDATE empresas 
             SET razon_social=$1, ruc=$2, direccion=$3, distrito=$4, provincia=$5, telefono=$6, email_contacto=$7, sitio_web=$8, updated_by_id=$9, updated_at=CURRENT_TIMESTAMP
             WHERE id=$10 RETURNING *`,
      [
        razon_social,
        ruc,
        direccion,
        distrito,
        provincia,
        telefono,
        email_contacto,
        sitio_web,
        updatedBy,
        id,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json({
      message: 'Empresa actualizada correctamente',
      empresa: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
};

// 4. Eliminar Empresa (Baja Lógica - Inactivar)
const deleteEmpresa = async (req, res) => {
  const { id } = req.params;
  const updatedBy = req.user ? req.user.id : null;

  try {
    const result = await db.query(
      'UPDATE empresas SET activo = false, updated_by_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [updatedBy, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json({ message: 'Empresa desactivada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desactivar empresa' });
  }
};

// 5. Reactivar Empresa
const activateEmpresa = async (req, res) => {
  const { id } = req.params;
  const updatedBy = req.user ? req.user.id : null;

  try {
    const result = await db.query(
      'UPDATE empresas SET activo = true, updated_by_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [updatedBy, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json({ message: 'Empresa reactivada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reactivar empresa' });
  }
};

module.exports = {
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  activateEmpresa,
};
