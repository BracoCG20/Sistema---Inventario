import React, { useState, useEffect } from 'react';
import api from '../../services/api';
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
} from 'react-icons/fa';
import Modal from '../../components/Modal/Modal';
import AddProveedorForm from './AddProveedorForm';
import './Proveedores.scss';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState(null);

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/proveedores');
      // Ordenar: Activos primero, luego por nombre
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

  const handleDelete = async (id) => {
    if (!window.confirm('¿Dar de baja a este proveedor? Pasará a inactivo.'))
      return;
    try {
      await api.delete(`/proveedores/${id}`);
      toast.success('Proveedor desactivado');
      fetchProveedores();
    } catch (error) {
      toast.error('Error al desactivar');
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('¿Reactivar este proveedor?')) return;
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
                <th>Teléfono / Email</th>
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
                    <div
                      className='contact-info'
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {prov.telefono && (
                        <div className='email-cell'>
                          <FaPhone size={12} /> {prov.telefono}
                        </div>
                      )}
                      {prov.email && (
                        <div className='email-cell'>
                          <FaEnvelope size={12} /> {prov.email}
                        </div>
                      )}
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
                            onClick={() => handleDelete(prov.id)}
                            title='Dar de baja'
                          >
                            <FaTrash />
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
    </div>
  );
};

export default Proveedores;
