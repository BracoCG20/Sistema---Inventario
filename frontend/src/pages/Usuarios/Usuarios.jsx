import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaUserTie } from 'react-icons/fa';
import Modal from '../../components/Modal/Modal';
import AddUsuarioForm from './AddUsuarioForm';
// Reutilizamos estilos de Equipos para la tabla
import '../Equipos/Equipos.scss';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchUsuarios();
  };

  if (loading)
    return <div style={{ padding: '2rem' }}>Cargando personal...</div>;

  return (
    <div className='equipos-container'>
      {' '}
      {/* Usamos la misma clase contenedor */}
      <div className='page-header'>
        <h1>Directorio de Personal</h1>
        <button
          className='btn-add'
          onClick={() => setIsModalOpen(true)}
        >
          <FaPlus /> Nuevo Colaborador
        </button>
      </div>
      <div className='table-container'>
        {usuarios.length === 0 ? (
          <div className='no-data'>No hay personal registrado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Correo</th>
                <th>Empresa</th>
                <th>Cargo</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 'bold' }}>{user.dni}</td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div
                        style={{
                          background: '#e0e7ff',
                          color: '#4338ca',
                          padding: '8px',
                          borderRadius: '50%',
                          display: 'flex',
                        }}
                      >
                        <FaUserTie />
                      </div>
                      {user.nombres} {user.apellidos}
                    </div>
                  </td>
                  <td>{user.correo}</td>
                  <td>{user.empresa}</td>
                  <td>
                    <span className='status-badge mantenimiento'>
                      {user.cargo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Modal de Registro */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title='Registrar Nuevo Colaborador'
      >
        <AddUsuarioForm onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
};

export default Usuarios;
