import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './FormStyles.scss';

// Importamos el Select personalizado
import CustomSelect from '../../components/Select/CustomSelect';

const AddEquipoForm = ({ onSuccess, equipoToEdit }) => {
  // Estado inicial
  // Agregamos fecha_compra al estado
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    serie: '',
    estado: 'operativo',
    fecha_compra: '',
  });

  // Estado para especificaciones dinámicas
  const [specsList, setSpecsList] = useState([
    { key: 'Ram', value: '' },
    { key: 'Procesador', value: '' },
  ]);

  // Opciones para el Select de Estado
  const estadoOptions = [
    { value: 'operativo', label: 'Operativo' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'malogrado', label: 'Malogrado' },
  ];

  // EFECTO: Si hay un equipo para editar, rellenamos el formulario
  useEffect(() => {
    if (equipoToEdit) {
      setFormData({
        marca: equipoToEdit.marca,
        modelo: equipoToEdit.modelo,
        serie: equipoToEdit.serie,
        estado: equipoToEdit.estado,
        // Formateamos la fecha si existe (cortamos la parte 'T00:00:00')
        fecha_compra: equipoToEdit.fecha_compra
          ? equipoToEdit.fecha_compra.split('T')[0]
          : '',
      });

      // Convertir el objeto JSON de specs a nuestro Array para los inputs
      if (equipoToEdit.especificaciones) {
        const specsArray = Object.entries(equipoToEdit.especificaciones).map(
          ([key, value]) => ({ key, value }),
        );
        // Si el array está vacío, dejamos al menos una fila
        setSpecsList(
          specsArray.length > 0 ? specsArray : [{ key: '', value: '' }],
        );
      }
    }
  }, [equipoToEdit]);

  // Manejador para inputs de texto normales
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejadores para Specs Dinámicas
  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specsList];
    newSpecs[index][field] = value;
    setSpecsList(newSpecs);
  };

  const addSpecRow = () => setSpecsList([...specsList, { key: '', value: '' }]);

  const removeSpecRow = (index) =>
    setSpecsList(specsList.filter((_, i) => i !== index));

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convertir Array a Objeto JSON para la BD
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
      onSuccess(); // Cerrar modal y recargar tabla
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
            placeholder='Ej: Dell'
          />
        </div>
        <div className='input-group'>
          <label>Modelo</label>
          <input
            name='modelo'
            value={formData.modelo}
            onChange={handleChange}
            required
            placeholder='Ej: Latitude 5420'
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
            placeholder='Ej: 8H2J9K1'
          />
        </div>

        {/* NUEVO INPUT DE FECHA */}
        <div className='input-group'>
          <label>Fecha de Compra</label>
          <input
            type='date'
            name='fecha_compra'
            value={formData.fecha_compra}
            onChange={handleChange}
            // Puedes agregar 'required' si es obligatorio
          />
        </div>
      </div>

      <div className='form-row'>
        <div
          className='input-group'
          style={{ width: '100%' }}
        >
          <label>Estado</label>
          <CustomSelect
            options={estadoOptions}
            value={estadoOptions.find((op) => op.value === formData.estado)}
            onChange={(selected) =>
              setFormData({ ...formData, estado: selected?.value || '' })
            }
            placeholder='Seleccione estado...'
          />
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
              placeholder='Propiedad (ej: Ram)'
              value={spec.key}
              onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
            />
            <input
              placeholder='Valor (ej: 16GB)'
              value={spec.value}
              onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
            />
            <button
              type='button'
              className='btn-remove'
              onClick={() => removeSpecRow(index)}
              title='Eliminar campo'
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
