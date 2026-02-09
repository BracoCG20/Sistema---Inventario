import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaTimes, FaBuilding, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import '../UserListModal/UserListModal.scss'; // Reusamos estilos de lista

const EmpresaListModal = ({ onClose }) => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmpresas = async () => {
    try {
      const res = await api.get('/empresas');
      setEmpresas(res.data);
    } catch (error) {
      toast.error('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  return (
    <div
      className='list-modal-overlay'
      onClick={onClose}
    >
      <div
        className='list-modal-content'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>
            <FaBuilding /> Gestión de Empresas
          </h2>
          <button
            className='btn-close'
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Razón Social</th>
                <th>RUC</th>
                <th>Contacto</th>
                <th>Ubicación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.razon_social}</strong>
                  </td>
                  <td>{e.ruc}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {e.email_contacto && <div>{e.email_contacto}</div>}
                      {e.telefono && (
                        <div style={{ color: '#64748b' }}>
                          <FaPhone size={10} /> {e.telefono}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {e.direccion ? (
                      <span title={e.direccion}>
                        <FaMapMarkerAlt /> {e.direccion.substring(0, 20)}...
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${e.activo ? 'active' : 'inactive'}`}
                    >
                      {e.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EmpresaListModal;
