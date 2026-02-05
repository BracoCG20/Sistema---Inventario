import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './FormStyles.scss';

// Recibimos 'equipoToEdit' (datos del equipo si vamos a editar)
const AddEquipoForm = ({ onSuccess, equipoToEdit }) => {
  // Estado inicial vacío
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    serie: '',
    estado: 'operativo',
  });

  const [specsList, setSpecsList] = useState([
    { key: 'Ram', value: '' },
    { key: 'Procesador', value: '' },
  ]);

  // EFECTO: Si hay un equipo para editar, rellenamos el formulario
  useEffect(() => {
    if (equipoToEdit) {
      setFormData({
        marca: equipoToEdit.marca,
        modelo: equipoToEdit.modelo,
        serie: equipoToEdit.serie,
        estado: equipoToEdit.estado,
      });

      // Convertir el objeto JSON de specs a nuestro Array para los inputs
      // De { "Color": "Rojo" }  --->  [{ key: "Color", value: "Rojo" }]
      if (equipoToEdit.especificaciones) {
        const specsArray = Object.entries(equipoToEdit.especificaciones).map(
          ([key, value]) => ({
            key,
            value,
          }),
        );
        // Si el array está vacío, dejamos al menos una fila
        setSpecsList(
          specsArray.length > 0 ? specsArray : [{ key: '', value: '' }],
        );
      }
    }
  }, [equipoToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specsList];
    newSpecs[index][field] = value;
    setSpecsList(newSpecs);
  };

  const addSpecRow = () => setSpecsList([...specsList, { key: '', value: '' }]);
  const removeSpecRow = (index) =>
    setSpecsList(specsList.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convertir Array a Objeto JSON
    const specsObject = specsList.reduce((acc, item) => {
      if (item.key && item.value) acc[item.key] = item.value;
      return acc;
    }, {});

    const payload = { ...formData, especificaciones: specsObject };

    try {
      if (equipoToEdit) {
        // MODO EDICIÓN (PUT)
        await api.put(`/equipos/${equipoToEdit.id}`, payload);
        toast.success('Equipo actualizado correctamente');
      } else {
        // MODO CREACIÓN (POST)
        await api.post('/equipos', payload);
        toast.success('Equipo registrado correctamente');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar');
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
            value={formData.marca}
            onChange={handleChange}
            required
          />
        </div>
        <div className='input-group'>
          <label>Modelo</label>
          <input
            name='modelo'
            value={formData.modelo}
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
            value={formData.serie}
            onChange={handleChange}
            required
          />
        </div>
        <div className='input-group'>
          <label>Estado</label>
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

      <div className='specs-section'>
        <h4>Especificaciones Técnicas</h4>
        {specsList.map((spec, index) => (
          <div
            className='spec-row'
            key={index}
          >
            <input
              placeholder='Propiedad'
              value={spec.key}
              onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
            />
            <input
              placeholder='Valor'
              value={spec.value}
              onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
            />
            <button
              type='button'
              className='btn-remove'
              onClick={() => removeSpecRow(index)}
            >
              <FaTrash />
            </button>
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
        <FaSave style={{ marginRight: '8px' }} />
        {equipoToEdit ? 'Actualizar Cambios' : 'Guardar Nuevo Equipo'}
      </button>
    </form>
  );
};

export default AddEquipoForm;
