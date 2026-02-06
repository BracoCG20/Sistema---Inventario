import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaLaptop,
  FaCalendarAlt,
  FaBarcode,
} from 'react-icons/fa';
import Modal from '../../components/Modal/Modal';
import AddEquipoForm from './AddEquipoForm';
import './Equipos.scss';

const Equipos = () => {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('specs');

  // Datos seleccionados
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [equipoToEdit, setEquipoToEdit] = useState(null);

  const fetchEquipos = async () => {
    try {
      const res = await api.get('/equipos');
      const sorted = res.data.sort((a, b) => b.id - a.id);
      setEquipos(sorted);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipos();
  }, []);

  // Formatear Fecha
  const formatDate = (dateString) => {
    if (!dateString)
      return <span style={{ color: '#ccc' }}>No registrada</span>;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Acciones
  const handleViewSpecs = (equipo) => {
    setModalType('specs');
    setSelectedEquipo(equipo);
    setIsModalOpen(true);
  };

  const handleAddEquipo = () => {
    setModalType('form');
    setEquipoToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditEquipo = (equipo) => {
    setModalType('form');
    setEquipoToEdit(equipo);
    setIsModalOpen(true);
  };

  const handleDeleteEquipo = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este equipo?')) {
      try {
        await api.delete(`/equipos/${id}`);
        toast.success('Equipo eliminado');
        fetchEquipos();
      } catch (error) {
        toast.error('No se pudo eliminar');
      }
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchEquipos();
  };

  const generateCode = (id) => `EQ-${id.toString().padStart(4, '0')}`;

  if (loading)
    return <div style={{ padding: '2rem' }}>Cargando inventario...</div>;

  return (
    <div className='equipos-container'>
      <div className='page-header'>
        <h1>Inventario de Equipos</h1>
        <button
          className='btn-add'
          onClick={handleAddEquipo}
        >
          <FaPlus /> Nuevo Equipo
        </button>
      </div>

      <div className='table-container'>
        {equipos.length === 0 ? (
          <div className='no-data'>No hay equipos registrados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Tipo</th>
                <th>Equipo</th>
                <th>Serie (S/N)</th>
                <th>Fecha Compra</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className='device-icon-box'>
                      <FaLaptop />
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontWeight: '700',
                          color: '#334155',
                          fontSize: '0.95rem',
                        }}
                      >
                        {item.marca}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {item.modelo}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: 'monospace',
                        color: '#475569',
                        fontSize: '0.9rem',
                        background: '#f8fafc',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        width: 'fit-content',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <FaBarcode style={{ color: '#94a3b8' }} />
                      {item.serie}
                    </div>
                  </td>

                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#475569',
                        fontSize: '0.9rem',
                      }}
                    >
                      <FaCalendarAlt
                        style={{ color: '#94a3b8', marginRight: '8px' }}
                      />
                      {formatDate(item.fecha_compra)}
                    </div>
                  </td>

                  <td>
                    <span className={`status-badge ${item.estado}`}>
                      {item.estado}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className='action-btn'
                        onClick={() => handleViewSpecs(item)}
                        title='Ver Ficha'
                      >
                        <FaEye />
                      </button>
                      <button
                        className='action-btn'
                        onClick={() => handleEditEquipo(item)}
                        style={{ color: '#f59e0b' }}
                        title='Editar'
                      >
                        <FaEdit />
                      </button>
                      <button
                        className='action-btn'
                        onClick={() => handleDeleteEquipo(item.id)}
                        style={{ color: '#ef4444' }}
                        title='Eliminar'
                      >
                        <FaTrash />
                      </button>
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
        title={
          modalType === 'specs'
            ? selectedEquipo
              ? `Ficha Técnica: ${selectedEquipo.modelo}`
              : 'Detalle'
            : equipoToEdit
              ? 'Editar Equipo'
              : 'Registrar Nuevo Equipo'
        }
      >
        {modalType === 'specs' ? (
          selectedEquipo ? (
            <div
              className='specs-grid'
              style={{ gap: '0' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '1px solid #eee',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '15px',
                    background: 'rgba(124, 58, 237, 0.1)',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                  }}
                >
                  <FaLaptop />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b' }}>
                    {selectedEquipo.marca} {selectedEquipo.modelo}
                  </h3>
                  <span
                    className={`status-badge ${selectedEquipo.estado}`}
                    style={{ marginTop: '5px', display: 'inline-block' }}
                  >
                    {selectedEquipo.estado}
                  </span>
                </div>
              </div>

              <h4
                style={{
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                  marginBottom: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Identificación
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    background: '#f1f5f9',
                    padding: '12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <FaBarcode style={{ fontSize: '1.5rem', color: '#64748b' }} />
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: '#64748b',
                        textTransform: 'uppercase',
                      }}
                    >
                      Código Interno
                    </span>
                    <span
                      style={{
                        fontWeight: '700',
                        color: '#1e293b',
                        fontSize: '1.1rem',
                      }}
                    >
                      {generateCode(selectedEquipo.id)}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                    }}
                  >
                    Número de Serie (S/N)
                  </span>
                  <span
                    style={{
                      fontWeight: '600',
                      color: '#334155',
                      fontFamily: 'monospace',
                    }}
                  >
                    {selectedEquipo.serie}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ padding: '5px' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                    }}
                  >
                    Fecha de Compra
                  </span>
                  <strong style={{ color: '#334155' }}>
                    {formatDate(selectedEquipo.fecha_compra)}
                  </strong>
                </div>
                <div style={{ padding: '5px' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                    }}
                  >
                    Registro en Sistema
                  </span>
                  <strong style={{ color: '#334155' }}>
                    {new Date(
                      selectedEquipo.fecha_registro,
                    ).toLocaleDateString()}
                  </strong>
                </div>
              </div>

              <h4
                style={{
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                  marginBottom: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginTop: '1rem',
                }}
              >
                Especificaciones Técnicas
              </h4>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {selectedEquipo.especificaciones &&
                Object.keys(selectedEquipo.especificaciones).length > 0 ? (
                  Object.entries(selectedEquipo.especificaciones).map(
                    ([key, value], index) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px 15px',
                          borderBottom: '1px solid #f1f5f9',
                          background: index % 2 === 0 ? '#fff' : '#f8fafc',
                        }}
                      >
                        <strong
                          style={{
                            textTransform: 'capitalize',
                            color: '#64748b',
                            fontSize: '0.9rem',
                          }}
                        >
                          {key.replace('_', ' ')}
                        </strong>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          {value}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <p
                    style={{
                      padding: '15px',
                      color: '#cbd5e1',
                      textAlign: 'center',
                      margin: 0,
                    }}
                  >
                    Sin especificaciones detalladas.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              Cargando ficha...
            </div>
          )
        ) : (
          <AddEquipoForm
            onSuccess={handleFormSuccess}
            equipoToEdit={equipoToEdit}
          />
        )}
      </Modal>
    </div>
  );
};

export default Equipos;
