import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
// Importamos los nuevos iconos (Lápiz y Basura)
import { FaPlus, FaEye, FaMicrochip, FaEdit, FaTrash } from 'react-icons/fa';
import Modal from '../../components/Modal/Modal';
import AddEquipoForm from './AddEquipoForm';
import './Equipos.scss';

const Equipos = () => {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('specs');

  // Estados Selección
  const [selectedSpecs, setSelectedSpecs] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [equipoToEdit, setEquipoToEdit] = useState(null); // <--- NUEVO: Equipo a editar

  const fetchEquipos = async () => {
    try {
      const res = await api.get('/equipos');
      setEquipos(res.data);
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

  // --- ACCIONES ---

  const handleViewSpecs = (equipo) => {
    setModalType('specs');
    setSelectedSpecs(equipo.especificaciones);
    setSelectedModel(`${equipo.marca} ${equipo.modelo}`);
    setIsModalOpen(true);
  };

  const handleAddEquipo = () => {
    setModalType('form'); // Usamos 'form' para crear y editar
    setEquipoToEdit(null); // Limpiamos (Modo Crear)
    setIsModalOpen(true);
  };

  const handleEditEquipo = (equipo) => {
    setModalType('form'); // Usamos el mismo formulario
    setEquipoToEdit(equipo); // Pasamos los datos (Modo Editar)
    setIsModalOpen(true);
  };

  const handleDeleteEquipo = async (id) => {
    if (
      window.confirm(
        '¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.',
      )
    ) {
      try {
        await api.delete(`/equipos/${id}`);
        toast.success('Equipo eliminado');
        fetchEquipos(); // Recargar tabla
      } catch (error) {
        console.error(error);
        toast.error('No se pudo eliminar (quizás tiene entregas registradas)');
      }
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchEquipos();
  };

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
          <div className='no-data'>No hay equipos registrados aún.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Serie</th>
                <th>Estado</th>
                <th>Acciones</th> {/* Columna Acciones */}
              </tr>
            </thead>
            <tbody>
              {equipos.map((item) => (
                <tr key={item.id}>
                  <td>{item.marca}</td>
                  <td>{item.modelo}</td>
                  <td>{item.serie}</td>
                  <td>
                    <span className={`status-badge ${item.estado}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Ver Specs */}
                      <button
                        className='action-btn'
                        onClick={() => handleViewSpecs(item)}
                        title='Ver Especificaciones'
                      >
                        <FaEye />
                      </button>

                      {/* Editar */}
                      <button
                        className='action-btn'
                        onClick={() => handleEditEquipo(item)}
                        title='Editar Equipo'
                        style={{ color: '#f59e0b' }} // Color Ámbar
                      >
                        <FaEdit />
                      </button>

                      {/* Eliminar */}
                      <button
                        className='action-btn'
                        onClick={() => handleDeleteEquipo(item.id)}
                        title='Eliminar Equipo'
                        style={{ color: '#ef4444' }} // Color Rojo
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

      {/* Modal Reutilizable */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        // Título dinámico
        title={
          modalType === 'specs'
            ? `Specs: ${selectedModel}`
            : equipoToEdit
              ? 'Editar Equipo'
              : 'Registrar Nuevo Equipo'
        }
      >
        {modalType === 'specs' ? (
          selectedSpecs ? (
            <div className='specs-grid'>
              {Object.entries(selectedSpecs).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <strong
                    style={{ textTransform: 'capitalize', color: '#64748b' }}
                  >
                    {key.replace('_', ' ')}:
                  </strong>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '1rem' }}>Sin datos.</p>
          )
        ) : (
          // Pasamos 'equipoToEdit' al formulario
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
