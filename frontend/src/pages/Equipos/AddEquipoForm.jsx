import { useState, useEffect } from 'react';
import {
  FaTrash,
  FaPlus,
  FaSave,
  FaExclamationTriangle,
  FaBuilding,
  FaHandshake,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './FormStyles.scss';

import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

const AddEquipoForm = ({ onSuccess, equipoToEdit }) => {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    serie: '',
    estado: 'operativo',
    fecha_compra: '',

    // NUEVOS CAMPOS
    condicion_equipo: 'propio', // 'propio' o 'alquilado'
    proveedor_id: null,
    fecha_fin_alquiler: '',
  });

  const [marcasOptions, setMarcasOptions] = useState([]);
  const [proveedoresOptions, setProveedoresOptions] = useState([]); // Estado para proveedores
  const [loadingData, setLoadingData] = useState(false);

  const [specsList, setSpecsList] = useState([
    { key: 'Ram', value: '' },
    { key: 'Procesador', value: '' },
  ]);

  const estadoOptions = [
    { value: 'operativo', label: 'Operativo' },
    { value: 'mantenimiento', label: 'En Mantenimiento' },
    { value: 'malogrado', label: 'Malogrado' },
  ];

  const condicionOptions = [
    { value: 'propio', label: 'Equipo Propio (Activo Fijo)' },
    { value: 'alquilado', label: 'Equipo Alquilado (Renting)' },
  ];

  // 1. CARGAR DATOS (Marcas y Proveedores)
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        // Cargar Marcas
        const resMarcas = await api.get('/equipos/marcas');
        setMarcasOptions(
          resMarcas.data.map((m) => ({ value: m.nombre, label: m.nombre })),
        );

        // Cargar Proveedores (Necesitas crear esta ruta en el backend luego)
        // Por ahora simulamos que si falla no rompe la app
        try {
          const resProv = await api.get('/proveedores');
          const provOps = resProv.data
            .filter((p) => p.activo)
            .map((p) => ({ value: p.id, label: p.razon_social }));
          setProveedoresOptions(provOps);
        } catch (err) {
          console.log('Aún no hay endpoint de proveedores creado');
        }
      } catch (error) {
        console.error('Error cargando datos auxiliares');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // 2. RELLENAR DATOS SI ES EDICIÓN
  useEffect(() => {
    if (equipoToEdit) {
      setFormData({
        marca: equipoToEdit.marca || '',
        modelo: equipoToEdit.modelo || '',
        serie: equipoToEdit.serie || '',
        estado: equipoToEdit.estado || 'operativo',
        fecha_compra: equipoToEdit.fecha_compra
          ? equipoToEdit.fecha_compra.split('T')[0]
          : '',

        // Lógica para detectar si es propio o alquilado
        condicion_equipo: equipoToEdit.proveedor_id ? 'alquilado' : 'propio',
        proveedor_id: equipoToEdit.proveedor_id || null,
        fecha_fin_alquiler: equipoToEdit.fecha_fin_alquiler
          ? equipoToEdit.fecha_fin_alquiler.split('T')[0]
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

  // --- HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMarcaChange = (newValue) => {
    setFormData({ ...formData, marca: newValue ? newValue.value : '' });
  };

  const handleCreateMarca = async (inputValue) => {
    // ... (Tu lógica de crear marca se mantiene igual) ...
  };

  const handleEstadoChange = (newValue) => {
    setFormData({
      ...formData,
      estado: newValue ? newValue.value : 'operativo',
    });
  };

  // Handler para condición (Propio/Alquilado)
  const handleCondicionChange = (newValue) => {
    const val = newValue ? newValue.value : 'propio';
    setFormData((prev) => ({
      ...prev,
      condicion_equipo: val,
      // Si cambia a propio, limpiamos proveedor
      proveedor_id: val === 'propio' ? null : prev.proveedor_id,
    }));
  };

  // Handler para Proveedor
  const handleProveedorChange = (newValue) => {
    setFormData({
      ...formData,
      proveedor_id: newValue ? newValue.value : null,
    });
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

    // Validación extra
    if (formData.condicion_equipo === 'alquilado' && !formData.proveedor_id) {
      return toast.warning(
        'Debes seleccionar un proveedor para equipos alquilados',
      );
    }

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

  // Estilos (Igual que antes)
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
      {/* --- NUEVA SECCIÓN: CONDICIÓN DEL EQUIPO --- */}
      <div className='form-row'>
        <div className='input-group'>
          <label style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <FaHandshake /> Condición de Adquisición
          </label>
          <Select
            options={condicionOptions}
            value={condicionOptions.find(
              (op) => op.value === formData.condicion_equipo,
            )}
            onChange={handleCondicionChange}
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>

        {/* Muestra Proveedor SOLO si es Alquilado */}
        {formData.condicion_equipo === 'alquilado' ? (
          <div className='input-group'>
            <label
              style={{
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
                color: '#4f46e5',
              }}
            >
              <FaBuilding /> Proveedor *
            </label>
            <Select
              options={proveedoresOptions}
              value={proveedoresOptions.find(
                (op) => op.value === formData.proveedor_id,
              )}
              onChange={handleProveedorChange}
              styles={customSelectStyles}
              placeholder='Seleccione Empresa...'
              isLoading={loadingData}
            />
          </div>
        ) : (
          <div className='input-group'>
            <label>Fecha de Compra (Propio)</label>
            <input
              type='date'
              name='fecha_compra'
              value={formData.fecha_compra}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {formData.condicion_equipo === 'alquilado' && (
        <div
          className='form-row'
          style={{ marginTop: '0.5rem' }}
        >
          <div className='input-group'>
            <label>Inicio del Alquiler</label>
            <input
              type='date'
              name='fecha_compra' // Usamos fecha_compra como fecha de inicio alquiler para reutilizar la col
              value={formData.fecha_compra}
              onChange={handleChange}
            />
          </div>
          <div className='input-group'>
            <label>Fin del Contrato (Opcional)</label>
            <input
              type='date'
              name='fecha_fin_alquiler'
              value={formData.fecha_fin_alquiler}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      <hr style={{ margin: '1rem 0', borderTop: '1px solid #e2e8f0' }} />

      {/* --- DATOS DEL EQUIPO (IGUAL QUE ANTES) --- */}
      <div className='form-row'>
        <div className='input-group'>
          <label>Marca</label>
          <CreatableSelect
            isClearable
            isDisabled={loadingData}
            onChange={handleMarcaChange}
            // onCreateOption={handleCreateMarca} // Descomentar si usas la función de crear
            options={marcasOptions}
            value={marcasOptions.find((op) => op.value === formData.marca)}
            styles={customSelectStyles}
            placeholder='Agregar Marca'
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
      </div>

      {/* ESTADO (Solo visible al editar) */}
      {equipoToEdit && (
        <div
          className='input-group'
          style={{ marginTop: '1rem' }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: '#f59e0b',
              fontWeight: '700',
            }}
          >
            <FaExclamationTriangle /> Estado Actual
          </label>
          <Select
            options={estadoOptions}
            value={estadoOptions.find((op) => op.value === formData.estado)}
            onChange={handleEstadoChange}
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>
      )}

      {/* SPECS */}
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
