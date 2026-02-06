import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaUserPlus, FaEdit, FaLock } from 'react-icons/fa'; // Icono de candado opcional
import api from '../../services/api';
import CustomSelect from '../../components/Select/CustomSelect';
import '../Equipos/FormStyles.scss';

const AddUsuarioForm = ({ onSuccess, usuarioToEdit }) => {
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo: '',
    empresa: '',
    cargo: '',
    genero: 'hombre',
    telefono: '',
  });

  const genderOptions = [
    { value: 'hombre', label: 'Hombre (Sr.)' },
    { value: 'mujer', label: 'Mujer (Srta.)' },
  ];

  useEffect(() => {
    if (usuarioToEdit) {
      setFormData({
        dni: usuarioToEdit.dni,
        nombres: usuarioToEdit.nombres,
        apellidos: usuarioToEdit.apellidos,
        correo: usuarioToEdit.correo,
        empresa: usuarioToEdit.empresa || '',
        cargo: usuarioToEdit.cargo || '',
        genero: usuarioToEdit.genero || 'hombre',
        telefono: usuarioToEdit.telefono || '',
      });
    }
  }, [usuarioToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (usuarioToEdit) {
        // UPDATE
        await api.put(`/usuarios/${usuarioToEdit.id}`, formData);
        toast.success('Datos actualizados correctamente');
      } else {
        // CREATE
        await api.post('/usuarios', formData);
        toast.success('Colaborador registrado correctamente');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar los datos');
    }
  };

  // Helper para saber si estamos editando (para bloquear campos)
  const isEdit = !!usuarioToEdit;

  // Estilo para inputs deshabilitados
  const disabledStyle = {
    background: '#f1f5f9',
    color: '#94a3b8',
    cursor: 'not-allowed',
  };

  return (
    <form
      className='equipo-form'
      onSubmit={handleSubmit}
    >
      {isEdit && (
        <div
          style={{
            marginBottom: '10px',
            fontSize: '0.85rem',
            color: '#f59e0b',
            background: '#fffbeb',
            padding: '8px',
            borderRadius: '6px',
          }}
        >
          <FaLock style={{ marginRight: '5px' }} /> Solo se permite editar
          contacto y cargo.
        </div>
      )}

      <div className='form-row'>
        <div className='input-group'>
          <label>DNI / Documento</label>
          <input
            name='dni'
            value={formData.dni}
            onChange={handleChange}
            required
            disabled={isEdit} // BLOQUEADO
            style={isEdit ? disabledStyle : {}}
          />
        </div>
        <div className='input-group'>
          <label>Género</label>
          <CustomSelect
            options={genderOptions}
            // CORRECCIÓN ERROR JS: Usamos encadenamiento opcional (?.)
            value={genderOptions.find((op) => op.value === formData.genero)}
            onChange={(op) =>
              setFormData({ ...formData, genero: op?.value || 'hombre' })
            }
            isDisabled={isEdit} // BLOQUEADO
            placeholder='Seleccione...'
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>Nombres</label>
          <input
            name='nombres'
            value={formData.nombres}
            onChange={handleChange}
            required
            disabled={isEdit} // BLOQUEADO
            style={isEdit ? disabledStyle : {}}
          />
        </div>
        <div className='input-group'>
          <label>Apellidos</label>
          <input
            name='apellidos'
            value={formData.apellidos}
            onChange={handleChange}
            required
            disabled={isEdit} // BLOQUEADO
            style={isEdit ? disabledStyle : {}}
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>Correo Electrónico</label>
          {/* ESTE SÍ SE PUEDE EDITAR */}
          <input
            type='email'
            name='correo'
            value={formData.correo}
            onChange={handleChange}
            required
          />
        </div>
        <div className='input-group'>
          <label>WhatsApp / Celular</label>
          {/* ESTE SÍ SE PUEDE EDITAR */}
          <input
            name='telefono'
            type='tel'
            value={formData.telefono}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>Empresa</label>
          <input
            name='empresa'
            value={formData.empresa}
            onChange={handleChange}
            disabled={isEdit} // BLOQUEADO
            style={isEdit ? disabledStyle : {}}
          />
        </div>
        <div className='input-group'>
          <label>Cargo</label>
          {/* ESTE SÍ SE PUEDE EDITAR */}
          <input
            name='cargo'
            value={formData.cargo}
            onChange={handleChange}
          />
        </div>
      </div>

      <button
        type='submit'
        className='btn-submit'
      >
        {isEdit ? (
          <FaEdit style={{ marginRight: '8px' }} />
        ) : (
          <FaUserPlus style={{ marginRight: '8px' }} />
        )}
        {isEdit ? 'Guardar Cambios' : 'Registrar Colaborador'}
      </button>
    </form>
  );
};

export default AddUsuarioForm;
