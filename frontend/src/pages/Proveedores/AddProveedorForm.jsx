import React, { useState, useEffect } from 'react';
import {
  FaSave,
  FaBuilding,
  FaIdCard,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './AddProveedorForm.scss'; // Reutilizamos estilos de formulario

const AddProveedorForm = ({ onSuccess, providerToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    razon_social: '',
    ruc: '',
    email: '',
    telefono: '',
    nombre_contacto: '',
    direccion: '',
  });

  useEffect(() => {
    if (providerToEdit) {
      setFormData({
        razon_social: providerToEdit.razon_social || '',
        ruc: providerToEdit.ruc || '',
        email: providerToEdit.email || '',
        telefono: providerToEdit.telefono || '',
        nombre_contacto: providerToEdit.nombre_contacto || '',
        direccion: providerToEdit.direccion || '',
      });
    }
  }, [providerToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.razon_social || !formData.ruc) {
      return toast.warning('Razón Social y RUC son obligatorios');
    }

    setLoading(true);
    try {
      if (providerToEdit) {
        await api.put(`/proveedores/${providerToEdit.id}`, formData);
        toast.success('Proveedor actualizado');
      } else {
        await api.post('/proveedores', formData);
        toast.success('Proveedor registrado');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className='equipo-form'
      onSubmit={handleSubmit}
    >
      <div className='form-row'>
        <div className='input-group'>
          <label>
            <FaBuilding /> Razón Social *
          </label>
          <input
            name='razon_social'
            value={formData.razon_social}
            onChange={handleChange}
            placeholder='Ej: Renting Perú S.A.C.'
            required
          />
        </div>
        <div className='input-group'>
          <label>
            <FaIdCard /> RUC *
          </label>
          <input
            name='ruc'
            value={formData.ruc}
            onChange={handleChange}
            placeholder='201000...'
            required
            maxLength={11}
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>
            <FaUser /> Nombre de Contacto
          </label>
          <input
            name='nombre_contacto'
            value={formData.nombre_contacto}
            onChange={handleChange}
            placeholder='Ej: Juan Pérez'
          />
        </div>
        <div className='input-group'>
          <label>
            <FaPhone /> Teléfono / Celular
          </label>
          <input
            name='telefono'
            value={formData.telefono}
            onChange={handleChange}
            placeholder='+51 999...'
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>
            <FaEnvelope /> Correo Electrónico
          </label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            placeholder='contacto@empresa.com'
          />
        </div>
        <div className='input-group'>
          <label>
            <FaMapMarkerAlt /> Dirección
          </label>
          <input
            name='direccion'
            value={formData.direccion}
            onChange={handleChange}
            placeholder='Av. Principal 123...'
          />
        </div>
      </div>

      <button
        type='submit'
        className='btn-submit'
        disabled={loading}
      >
        <FaSave style={{ marginRight: '8px' }} />
        {providerToEdit ? 'Actualizar Proveedor' : 'Registrar Proveedor'}
      </button>
    </form>
  );
};

export default AddProveedorForm;
