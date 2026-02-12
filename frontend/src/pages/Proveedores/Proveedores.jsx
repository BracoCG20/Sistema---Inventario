import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import * as XLSX from 'xlsx'; // Importamos la librería para Excel
import { toast } from 'react-toastify';
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaBuilding,
  FaPhone,
  FaTruck,
  FaUndo,
  FaEnvelope,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaTimes,
  FaCheck,
  FaFileExcel,
  FaBan,
  FaLaptop, // Nuevo icono
} from 'react-icons/fa';
import Modal from '../../components/Modal/Modal';
import AddProveedorForm from './AddProveedorForm';
import './Proveedores.scss';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selección
  const [providerToEdit, setProviderToEdit] = useState(null);
  const [providerToAction, setProviderToAction] = useState(null);

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/proveedores');
      const sorted = res.data.sort((a, b) => {
        if (a.activo === b.activo)
          return a.razon_social.localeCompare(b.razon_social);
        return a.activo ? -1 : 1;
      });
      setProveedores(sorted);
    } catch (error) {
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  // --- FUNCIÓN EXPORTAR EXCEL ACTUALIZADA ---
  const exportarExcel = () => {
    if (proveedores.length === 0) {
      return toast.info('No hay datos para exportar');
    }

    const dataParaExcel = filtered.map((p) => ({
      Estado: p.activo ? 'ACTIVO' : 'INACTIVO',
      'Razón Social': p.razon_social,
      RUC: p.ruc,
      'Equipos Alquilados': p.total_equipos || 0, // Nuevo campo en Excel
      'Nombre de Contacto': p.nombre_contacto || '-',
      'Nombre de Contacto': p.nombre_contacto || '-',
      Teléfono: p.telefono || '-',
      Email: p.email || '-',
      Dirección: p.direccion || '-',

      // --- COLUMNAS DE AUDITORÍA AGREGADAS ---
      'Registrado Por': p.creador_nombre || 'Sistema',
      'Fecha Registro': p.created_at
        ? new Date(p.created_at).toLocaleString()
        : '-',
      'Modificado Por': p.modificador_nombre || '-',
      'Última Modificación': p.updated_at
        ? new Date(p.updated_at).toLocaleString()
        : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');
    XLSX.writeFile(wb, 'Reporte_Proveedores_Completo.xlsx');
    toast.success('Excel con auditoría generado');
  };

  const confirmDeactivate = (prov) => {
    setProviderToAction(prov);
    setIsDeleteModalOpen(true);
  };

  const handleDeactivate = async () => {
    try {
      await api.delete(`/proveedores/${providerToAction.id}`);
      toast.success('Proveedor desactivado');
      setIsDeleteModalOpen(false);
      fetchProveedores();
    } catch (error) {
      toast.error('Error al desactivar');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.put(`/proveedores/${id}/activate`);
      toast.success('Proveedor reactivado ✅');
      fetchProveedores();
    } catch (error) {
      toast.error('Error al activar');
    }
  };

  const handleEdit = (prov) => {
    setProviderToEdit(prov);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setProviderToEdit(null);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchProveedores();
  };

  const filtered = proveedores.filter(
    (p) =>
      p.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ruc.includes(searchTerm),
  );

  if (loading) return <div className='loading-state'>Cargando...</div>;

  return (
    <div className='proveedores-container'>
      <div className='page-header'>
        <h1>
          <FaTruck style={{ marginRight: '10px' }} /> Gestión de Proveedores
        </h1>
        <div className='header-actions'>
          {/* BOTÓN DE EXCEL AGREGADO */}
          <button
            className='btn-action-header btn-excel'
            onClick={exportarExcel}
          >
            <FaFileExcel /> Exportar Excel
          </button>
          <button
            className='btn-action-header btn-add'
            onClick={handleAdd}
          >
            <FaPlus /> Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className='search-bar'>
        <FaSearch color='#94a3b8' />
        <input
          placeholder='Buscar por Razón Social o RUC...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className='table-container'>
        {filtered.length === 0 ? (
          <div className='no-data'>No se encontraron proveedores.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className='center'>Estado</th>
                <th>Empresa / Razón Social</th>
                <th>RUC</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Correo Electrónico</th>
                <th className='center'>Equipos</th>
                <th className='center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prov) => (
                <tr
                  key={prov.id}
                  className={!prov.activo ? 'inactive-row' : ''}
                >
                  <td className='center'>
                    <span
                      className={`status-badge ${prov.activo ? 'operativo' : 'malogrado'}`}
                    >
                      {prov.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td>
                    <div className='user-avatar-cell'>
                      <div
                        className={`avatar-circle ${prov.activo ? 'male' : 'inactive'}`}
                      >
                        <FaBuilding />
                      </div>
                      <div className='user-info'>
                        <span
                          className={`name ${!prov.activo ? 'inactive' : ''}`}
                        >
                          {prov.razon_social}
                        </span>
                        <span className='audit-text'>
                          <FaMapMarkerAlt size={10} />{' '}
                          {prov.direccion || 'Sin dirección'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className='dni-text'>{prov.ruc}</span>
                  </td>
                  <td>
                    <span className='empresa-text'>
                      {prov.nombre_contacto || '-'}
                    </span>
                  </td>
                  <td>
                    {prov.telefono ? (
                      <div className='email-cell'>
                        <FaPhone size={12} /> {prov.telefono}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {prov.email ? (
                      <div className='email-cell'>
                        <FaEnvelope size={12} /> {prov.email}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className='center'>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '20px',
                        fontWeight: '700',
                        color: '#374151',
                        fontSize: '0.85rem',
                      }}
                    >
                      <FaLaptop
                        size={12}
                        color='#6b7280'
                      />
                      {prov.total_equipos || 0}
                    </div>
                  </td>
                  <td>
                    <div className='actions-cell'>
                      {prov.activo ? (
                        <>
                          <button
                            className='action-btn edit'
                            onClick={() => handleEdit(prov)}
                            title='Editar'
                          >
                            <FaEdit />
                          </button>
                          <button
                            className='action-btn delete'
                            onClick={() => confirmDeactivate(prov)}
                            title='Dar de baja'
                          >
                            <FaBan />
                          </button>
                        </>
                      ) : (
                        <button
                          className='action-btn activate'
                          onClick={() => handleActivate(prov.id)}
                          title='Reactivar'
                        >
                          <FaUndo />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={providerToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      >
        <AddProveedorForm
          onSuccess={handleFormSuccess}
          providerToEdit={providerToEdit}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title='Confirmar Acción'
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <FaExclamationTriangle />
          </div>
          <h3>¿Desactivar Proveedor?</h3>
          <p>
            Estás a punto de dar de baja a{' '}
            <strong>{providerToAction?.razon_social}</strong>.
            <br />
            Ya no aparecerá en la selección de nuevos equipos.
          </p>
          <div className='modal-actions'>
            <button
              className='btn-cancel'
              onClick={() => setIsDeleteModalOpen(false)}
            >
              <FaTimes /> Cancelar
            </button>
            <button
              className='btn-confirm'
              onClick={handleDeactivate}
            >
              <FaCheck /> Confirmar Baja
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Proveedores;
