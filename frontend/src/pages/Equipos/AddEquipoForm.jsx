import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './FormStyles.scss';

// Importamos el Select CREATABLE de react-select
import CreatableSelect from 'react-select/creatable';

const AddEquipoForm = ({ onSuccess, equipoToEdit }) => {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    serie: '',
    estado: 'operativo', // Valor por defecto fijo
    fecha_compra: '',
  });

  // Estado para las marcas del select
  const [marcasOptions, setMarcasOptions] = useState([]);
  const [loadingMarcas, setLoadingMarcas] = useState(false);

  // Estado para especificaciones dinámicas
  const [specsList, setSpecsList] = useState([
    { key: 'Ram', value: '' },
    { key: 'Procesador', value: '' },
  ]);

  // 1. CARGAR MARCAS AL INICIO
  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const res = await api.get('/equipos/marcas');
        const options = res.data.map((m) => ({
          value: m.nombre,
          label: m.nombre,
        }));
        setMarcasOptions(options);
      } catch (error) {
        console.error('Error cargando marcas');
      }
    };
    fetchMarcas();
  }, []);

  // 2. RELLENAR DATOS SI ES EDICIÓN
  useEffect(() => {
    if (equipoToEdit) {
      setFormData({
        marca: equipoToEdit.marca,
        modelo: equipoToEdit.modelo,
        serie: equipoToEdit.serie,
        estado: equipoToEdit.estado, // Mantiene el estado original si se edita
        fecha_compra: equipoToEdit.fecha_compra
          ? equipoToEdit.fecha_compra.split('T')[0]
          : '',
      });

      if (equipoToEdit.especificaciones) {
        const specsArray = Object.entries(equipoToEdit.especificaciones).map(
          ([key, value]) => ({ key, value }),
        );
        setSpecsList(
          specsArray.length > 0 ? specsArray : [{ key: '', value: '' }],
        );
      }
    }
  }, [equipoToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LÓGICA DE MARCAS ---
  const handleMarcaChange = (newValue) => {
    setFormData({ ...formData, marca: newValue ? newValue.value : '' });
  };

  const handleCreateMarca = async (inputValue) => {
    setLoadingMarcas(true);
    try {
      const res = await api.post('/equipos/marcas', { nombre: inputValue });
      const nuevaMarca = res.data;
      const newOption = { value: nuevaMarca.nombre, label: nuevaMarca.nombre };

      setLoadingMarcas(false);
      setMarcasOptions((prev) => [...prev, newOption]);
      setFormData({ ...formData, marca: newOption.value });

      toast.success(`Marca "${newOption.label}" agregada`);
    } catch (error) {
      console.error(error);
      toast.error('Error al crear marca');
      setLoadingMarcas(false);
    }
  };

  // --- LÓGICA DE SPECS ---
  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specsList];
    newSpecs[index][field] = value;
    setSpecsList(newSpecs);
  };
  const addSpecRow = () => setSpecsList([...specsList, { key: '', value: '' }]);
  const removeSpecRow = (index) =>
    setSpecsList(specsList.filter((_, i) => i !== index));

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const specsObject = specsList.reduce((acc, item) => {
      if (item.key && item.value) acc[item.key] = item.value;
      return acc;
    }, {});

    const payload = { ...formData, especificaciones: specsObject };

    try {
      if (equipoToEdit) {
        await api.put(`/equipos/${equipoToEdit.id}`, payload);
        toast.success('Equipo actualizado correctamente');
      } else {
        await api.post('/equipos', payload);
        toast.success('Equipo registrado correctamente');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  // ESTILOS PERSONALIZADOS PARA REACT-SELECT
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: 'rgba(255, 255, 255, 0.8)',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
      borderRadius: '8px',
      padding: '2px',
      boxShadow: state.isFocused ? '0 0 0 1px #7c3aed' : 'none',
      '&:hover': { borderColor: '#7c3aed' },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      overflow: 'hidden',
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f3f0ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
    }),
  };

  return (
    <form
      className='equipo-form'
      onSubmit={handleSubmit}
    >
      <div className='form-row'>
        {/* SELECT INTELIGENTE DE MARCA */}
        <div className='input-group'>
          <label>Marca</label>
          <CreatableSelect
            isClearable
            isDisabled={loadingMarcas}
            isLoading={loadingMarcas}
            onChange={handleMarcaChange}
            onCreateOption={handleCreateMarca}
            options={marcasOptions}
            value={marcasOptions.find((op) => op.value === formData.marca)}
            styles={customSelectStyles}
            placeholder='Agregar Marca'
            formatCreateLabel={(inputValue) => `Crear marca "${inputValue}"`}
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

        <div className='input-group'>
          <label>Fecha de Compra</label>
          <input
            type='date'
            name='fecha_compra'
            value={formData.fecha_compra}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* SE ELIMINÓ LA SECCIÓN DEL SELECT DE ESTADO */}

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
