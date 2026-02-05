import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
// Reutilizamos los estilos del formulario de equipos para mantener coherencia
import '../Equipos/FormStyles.scss';

const AddUsuarioForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo: '',
    empresa: '',
    cargo: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/usuarios', formData);
      toast.success('Colaborador registrado correctamente');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  return (
    <form
      className='equipo-form'
      onSubmit={handleSubmit}
    >
      <div className='form-row'>
        <div className='input-group'>
          <label>DNI / Documento</label>
          <input
            name='dni'
            placeholder='Ej: 12345678'
            onChange={handleChange}
            required
          />
        </div>
        <div className='input-group'>
          <label>Correo Electrónico</label>
          <input
            type='email'
            name='correo'
            placeholder='ejemplo@empresa.com'
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>Nombres</label>
          <input
            name='nombres'
            onChange={handleChange}
            required
          />
        </div>
        <div className='input-group'>
          <label>Apellidos</label>
          <input
            name='apellidos'
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>Empresa</label>
          <input
            name='empresa'
            placeholder='Ej: Tech Solutions'
            onChange={handleChange}
          />
        </div>
        <div className='input-group'>
          <label>Cargo / Puesto</label>
          <input
            name='cargo'
            placeholder='Ej: Desarrollador'
            onChange={handleChange}
          />
        </div>
      </div>

      <button
        type='submit'
        className='btn-submit'
      >
        Registrar Colaborador
      </button>
    </form>
  );
};

export default AddUsuarioForm;
