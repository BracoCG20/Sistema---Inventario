import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaTimes, FaBuilding } from 'react-icons/fa';
import '../RegisterAdminModal/RegisterAdminModal.scss';

const AddEmpresaModal = ({ onClose, onSuccess }) => {
  const [empresa, setEmpresa] = useState({
    razon_social: '',
    ruc: '',
    direccion: '',
    distrito: '', // <--- NUEVO
    provincia: '', // <--- NUEVO
    telefono: '',
    email_contacto: '',
    sitio_web: '',
  });

  const handleChange = (e) => {
    setEmpresa({ ...empresa, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/empresas', empresa);
      toast.success('Empresa registrada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error al registrar empresa');
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
              placeholder='Ej: Grupo SP S.A.C.'
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
                maxLength={11}
              />
            </div>
            <div className='input-group'>
              <label>Teléfono</label>
              <input
                name='telefono'
                value={empresa.telefono}
                onChange={handleChange}
                placeholder='+51 999 999 999'
              />
            </div>
          </div>

          <div className='input-group'>
            <label>Dirección Fiscal</label>
            <input
              name='direccion'
              value={empresa.direccion}
              onChange={handleChange}
              placeholder='Av. Principal 123, Oficina 401'
            />
          </div>

          {/* --- NUEVA FILA: DISTRITO Y PROVINCIA --- */}
          <div className='form-row'>
            <div className='input-group'>
              <label>Distrito</label>
              <input
                name='distrito'
                value={empresa.distrito}
                onChange={handleChange}
                placeholder='Ej: Miraflores'
              />
            </div>
            <div className='input-group'>
              <label>Provincia</label>
              <input
                name='provincia'
                value={empresa.provincia}
                onChange={handleChange}
                placeholder='Ej: Lima'
              />
            </div>
          </div>

          <div className='form-row'>
            <div className='input-group'>
              <label>Email de Contacto</label>
              <input
                type='email'
                name='email_contacto'
                value={empresa.email_contacto}
                onChange={handleChange}
                placeholder='contacto@empresa.com'
              />
            </div>
            <div className='input-group'>
              <label>Sitio Web</label>
              <input
                type='text'
                name='sitio_web'
                value={empresa.sitio_web}
                onChange={handleChange}
                placeholder='www.empresa.com'
              />
            </div>
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
