import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEye, FaMicrochip } from 'react-icons/fa';
import Modal from '../../components/Modal/Modal';
import AddEquipoForm from './AddEquipoForm'; // Importamos el formulario
import './Equipos.scss';

const Equipos = () => {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('specs'); // 'specs' o 'add'
  const [selectedSpecs, setSelectedSpecs] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');

  // 1. Cargar equipos desde la API
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

  // 2. Abrir Modal para Ver Especificaciones (Lectura)
  const handleViewSpecs = (equipo) => {
    setModalType('specs');
    setSelectedSpecs(equipo.especificaciones);
    setSelectedModel(`${equipo.marca} ${equipo.modelo}`);
    setIsModalOpen(true);
  };

  // 3. Abrir Modal para Agregar Equipo (Escritura)
  const handleAddEquipo = () => {
    setModalType('add');
    setIsModalOpen(true);
  };

  // 4. Callback cuando se crea un equipo exitosamente
  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchEquipos(); // Recargar la tabla
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSpecs(null);
  };

  if (loading)
    return <div style={{ padding: '2rem' }}>Cargando inventario...</div>;

  return (
    <div className='equipos-container'>
      {/* Cabecera */}
      <div className='page-header'>
        <h1>Inventario de Equipos</h1>
        <button
          className='btn-add'
          onClick={handleAddEquipo}
        >
          <FaPlus /> Nuevo Equipo
        </button>
      </div>

      {/* Tabla de Datos */}
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
                <th>Specs</th>
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
                    <button
                      className='action-btn'
                      onClick={() => handleViewSpecs(item)}
                      title='Ver Especificaciones'
                    >
                      <FaEye />
                    </button>
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
        onClose={handleCloseModal}
        title={
          modalType === 'specs'
            ? `Specs: ${selectedModel}`
            : 'Registrar Nuevo Equipo'
        }
      >
        {/* Lógica condicional: ¿Qué mostramos dentro del modal? */}
        {modalType === 'specs' ? (
          // CASO A: MOSTRAR ESPECIFICACIONES
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
            <p
              style={{
                textAlign: 'center',
                color: '#94a3b8',
                padding: '1rem',
              }}
            >
              <FaMicrochip
                style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
              />
              <br />
              Sin especificaciones registradas.
            </p>
          )
        ) : (
          // CASO B: MOSTRAR FORMULARIO DE AGREGAR
          <AddEquipoForm onSuccess={handleFormSuccess} />
        )}
      </Modal>
    </div>
  );
};

export default Equipos;
