import { useState } from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './FormStyles.scss'; // Importamos los estilos nuevos

const AddEquipoForm = ({ onSuccess }) => {
  // Estado del formulario base
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    serie: '',
    estado: 'operativo',
  });

  // Estado para las especificaciones dinámicas (Array de pares clave-valor)
  const [specsList, setSpecsList] = useState([
    { key: 'Ram', value: '' }, // Una fila por defecto
    { key: 'Procesador', value: '' },
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Lógica de Specs Dinámicas ---
  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specsList];
    newSpecs[index][field] = value;
    setSpecsList(newSpecs);
  };

  const addSpecRow = () => {
    setSpecsList([...specsList, { key: '', value: '' }]);
  };

  const removeSpecRow = (index) => {
    const newSpecs = specsList.filter((_, i) => i !== index);
    setSpecsList(newSpecs);
  };
  // ---------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Convertir el Array de Specs a un Objeto JSON plano para la BD
    // De: [{ key: 'Ram', value: '8GB' }]  ---> A: { "Ram": "8GB" }
    const specsObject = specsList.reduce((acc, item) => {
      if (item.key && item.value) {
        acc[item.key] = item.value;
      }
      return acc;
    }, {});

    // 2. Armar el payload final
    const payload = {
      ...formData,
      especificaciones: specsObject,
    };

    try {
      await api.post('/equipos', payload);
      toast.success('Equipo registrado correctamente');
      onSuccess(); // Avisar al padre para cerrar modal y recargar tabla
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
          <label>Marca</label>
          <input
            name='marca'
            placeholder='Ej: Dell'
            onChange={handleChange}
            required
          />
        </div>
        <div className='input-group'>
          <label>Modelo</label>
          <input
            name='modelo'
            placeholder='Ej: Latitude 5420'
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>Serie (S/N)</label>
          <input
            name='serie'
            placeholder='Ej: XYZ-1234'
            onChange={handleChange}
            required
          />
        </div>
        <div className='input-group'>
          <label>Estado Inicial</label>
          <select
            name='estado'
            value={formData.estado}
            onChange={handleChange}
          >
            <option value='operativo'>Operativo</option>
            <option value='mantenimiento'>Mantenimiento</option>
            <option value='malogrado'>Malogrado</option>
          </select>
        </div>
      </div>

      {/* SECCIÓN DINÁMICA */}
      <div className='specs-section'>
        <h4>Especificaciones Técnicas</h4>
        {specsList.map((spec, index) => (
          <div
            className='spec-row'
            key={index}
          >
            <input
              placeholder='Propiedad (ej: Color)'
              value={spec.key}
              onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
            />
            <input
              placeholder='Valor (ej: Negro)'
              value={spec.value}
              onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
            />
            {specsList.length > 1 && (
              <button
                type='button'
                className='btn-remove'
                onClick={() => removeSpecRow(index)}
              >
                <FaTrash />
              </button>
            )}
          </div>
        ))}

        <button
          type='button'
          className='btn-add-spec'
          onClick={addSpecRow}
        >
          <FaPlus /> Agregar campo
        </button>
      </div>

      <button
        type='submit'
        className='btn-submit'
      >
        Guardar Equipo
      </button>
    </form>
  );
};

export default AddEquipoForm;
