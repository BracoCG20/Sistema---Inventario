import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaTimes, FaBuilding } from 'react-icons/fa';
import '../RegisterAdminModal/RegisterAdminModal.scss'; // Reusamos los estilos del modal de usuario

const AddEmpresaModal = ({ onClose, onSuccess }) => {
  const [empresa, setEmpresa] = useState({
    razon_social: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email_contacto: '',
  });

  const handleChange = (e) => {
    setEmpresa({ ...empresa, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/empresas', empresa);
      toast.success('Empresa registrada exitosamente');
      onSuccess(); // Recargar lista si es necesario
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar empresa');
    }
  };

  return (
    <div
      className='modal-overlay'
      onClick={onClose}
    >
      <div
        className='modal-content'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>
            <FaBuilding /> Registrar Empresa
          </h2>
          <button
            className='btn-close'
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className='input-group'>
            <label>Razón Social *</label>
            <input
              name='razon_social'
              required
              value={empresa.razon_social}
              onChange={handleChange}
            />
          </div>
          <div className='form-row'>
            <div className='input-group'>
              <label>RUC *</label>
              <input
                name='ruc'
                required
                value={empresa.ruc}
                onChange={handleChange}
                placeholder='11 dígitos'
              />
            </div>
            <div className='input-group'>
              <label>Teléfono</label>
              <input
                name='telefono'
                value={empresa.telefono}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className='input-group'>
            <label>Dirección</label>
            <input
              name='direccion'
              value={empresa.direccion}
              onChange={handleChange}
            />
          </div>
          <div className='input-group'>
            <label>Email de Contacto</label>
            <input
              type='email'
              name='email_contacto'
              value={empresa.email_contacto}
              onChange={handleChange}
            />
          </div>

          <div className='modal-actions'>
            <button
              type='button'
              className='btn-cancel'
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='btn-confirm'
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmpresaModal;
