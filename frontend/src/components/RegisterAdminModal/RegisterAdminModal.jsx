import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaTimes, FaUserPlus } from 'react-icons/fa';
import Select from 'react-select';
import './RegisterAdminModal.scss';

const RegisterAdminModal = ({ onClose }) => {
  const [newUser, setNewUser] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    cargo: '',
    empresa: '',
    telefono: '',
    rol_id: 2, // Por defecto ID 2 (ej. Admin normal)
  });

  // Estado para las opciones de empresas
  const [empresaOptions, setEmpresaOptions] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  // Opciones estáticas para roles
  const roleOptions = [
    { value: 2, label: 'Administrador' },
    { value: 1, label: 'Super Administrador' },
  ];

  // --- CARGAR EMPRESAS AL MONTAR EL COMPONENTE ---
  useEffect(() => {
    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const res = await api.get('/empresas');
        // Mapeamos para el formato de react-select { value, label }
        // Usamos razon_social como valor porque tu backend de usuarios espera un string en 'empresa'
        const options = res.data.map((emp) => ({
          value: emp.razon_social,
          label: emp.razon_social,
        }));
        setEmpresaOptions(options);
      } catch (error) {
        console.error('Error al cargar empresas', error);
        toast.error('No se pudo cargar la lista de empresas');
      } finally {
        setLoadingEmpresas(false);
      }
    };
    fetchEmpresas();
  }, []);

  // Estilos personalizados para react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : 'none',
      padding: '2px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#4f46e5'
        : state.isFocused
          ? '#e0e7ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
    }),
  };

  // Manejador para inputs de texto normales
  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  // Manejador para el Select de Rol
  const handleRoleChange = (selectedOption) => {
    setNewUser({ ...newUser, rol_id: selectedOption.value });
  };

  // Manejador para el Select de Empresa (NUEVO)
  const handleEmpresaChange = (selectedOption) => {
    setNewUser({
      ...newUser,
      empresa: selectedOption ? selectedOption.value : '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      toast.success('Usuario creado exitosamente');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error al crear usuario');
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
            <FaUserPlus /> Registrar Nuevo Administrador
          </h2>
          <button
            className='btn-close'
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='form-row'>
            <div className='input-group'>
              <label>Nombre *</label>
              <input
                type='text'
                name='nombre'
                required
                onChange={handleChange}
                value={newUser.nombre}
              />
            </div>
            <div className='input-group'>
              <label>Apellidos</label>
              <input
                type='text'
                name='apellidos'
                onChange={handleChange}
                value={newUser.apellidos}
              />
            </div>
          </div>

          <div className='input-group'>
            <label>Email (Usuario) *</label>
            <input
              type='email'
              name='email'
              required
              onChange={handleChange}
              value={newUser.email}
            />
          </div>

          <div className='input-group'>
            <label>Contraseña *</label>
            <input
              type='password'
              name='password'
              required
              onChange={handleChange}
              value={newUser.password}
            />
          </div>

          {/* SELECT DE ROLES */}
          <div className='input-group'>
            <label>Rol de Acceso *</label>
            <Select
              options={roleOptions}
              value={roleOptions.find((op) => op.value === newUser.rol_id)}
              onChange={handleRoleChange}
              styles={customSelectStyles}
              placeholder='Seleccione un rol'
              isSearchable={false}
            />
          </div>

          <div className='form-row'>
            {/* SELECT DE EMPRESA (MODIFICADO) */}
            <div className='input-group'>
              <label>Empresa</label>
              <Select
                options={empresaOptions}
                value={empresaOptions.find(
                  (op) => op.value === newUser.empresa,
                )}
                onChange={handleEmpresaChange}
                styles={customSelectStyles}
                placeholder={
                  loadingEmpresas ? 'Cargando...' : 'Seleccione empresa...'
                }
                isLoading={loadingEmpresas}
                isClearable
              />
            </div>

            <div className='input-group'>
              <label>Cargo</label>
              <input
                type='text'
                name='cargo'
                onChange={handleChange}
                value={newUser.cargo}
              />
            </div>
          </div>

          <div className='input-group'>
            <label>Teléfono</label>
            <input
              type='text'
              name='telefono'
              onChange={handleChange}
              value={newUser.telefono}
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
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterAdminModal;
