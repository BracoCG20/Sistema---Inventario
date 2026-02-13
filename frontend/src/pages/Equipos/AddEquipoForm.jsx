import { useState, useEffect } from 'react';
import {
  FaTrash,
  FaPlus,
  FaSave,
  FaExclamationTriangle,
  FaBuilding,
  FaHandshake,
  FaCalendarAlt,
  FaMicrochip,
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
    empresa: '',
    condicion_equipo: 'propio',
    proveedor_id: null,
    fecha_fin_alquiler: '',
    // Especificaciones Principales Fijas
    ram: '',
    almacenamiento_valor: '', // <--- NUEVO ESTADO PARA EL NÚMERO
    almacenamiento_unidad: 'GB', // <--- NUEVO ESTADO PARA LA UNIDAD
    procesador: '',
  });

  // Estados para el Constructor Fácil de Procesador
  const [builderMarca, setBuilderMarca] = useState(null);
  const [builderModelo, setBuilderModelo] = useState(null);
  const [builderGen, setBuilderGen] = useState(null);

  const [marcasOptions, setMarcasOptions] = useState([]);
  const [proveedoresOptions, setProveedoresOptions] = useState([]);
  const [empresasOptions, setEmpresasOptions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Lista para Otras Especificaciones adicionales
  const [specsList, setSpecsList] = useState([]);

  const estadoOptions = [
    { value: 'operativo', label: 'Operativo' },
    { value: 'mantenimiento', label: 'En Mantenimiento' },
    { value: 'malogrado', label: 'Malogrado' },
  ];

  const condicionOptions = [
    { value: 'propio', label: 'Equipo Propio' },
    { value: 'alquilado', label: 'Equipo Alquilado' },
  ];

  const unidadAlmacenamientoOptions = [
    { value: 'GB', label: 'GB' },
    { value: 'TB', label: 'TB' },
  ];

  // --- OPCIONES DEL GENERADOR DE PROCESADOR ---
  const marcaProcOptions = [
    { value: 'Intel', label: 'Intel' },
    { value: 'AMD', label: 'AMD' },
    { value: 'Apple', label: 'Apple' },
  ];

  const getModeloOptions = (marca) => {
    switch (marca) {
      case 'Intel':
        return [
          { value: 'Core i3', label: 'Core i3' },
          { value: 'Core i5', label: 'Core i5' },
          { value: 'Core i7', label: 'Core i7' },
          { value: 'Core i9', label: 'Core i9' },
          { value: 'Core Ultra 5', label: 'Core Ultra 5' },
          { value: 'Core Ultra 7', label: 'Core Ultra 7' },
          { value: 'Xeon', label: 'Xeon' },
        ];
      case 'AMD':
        return [
          { value: 'Ryzen 3', label: 'Ryzen 3' },
          { value: 'Ryzen 5', label: 'Ryzen 5' },
          { value: 'Ryzen 7', label: 'Ryzen 7' },
          { value: 'Ryzen 9', label: 'Ryzen 9' },
        ];
      case 'Apple':
        return [
          { value: 'M1', label: 'M1' },
          { value: 'M1 Pro', label: 'M1 Pro' },
          { value: 'M1 Max', label: 'M1 Max' },
          { value: 'M2', label: 'M2' },
          { value: 'M2 Pro', label: 'M2 Pro' },
          { value: 'M3', label: 'M3' },
          { value: 'M3 Pro', label: 'M3 Pro' },
          { value: 'M4', label: 'M4' },
        ];
      default:
        return [];
    }
  };

  const getGenOptions = (marca) => {
    switch (marca) {
      case 'Intel':
        return [
          { value: '8va Gen', label: '8va Gen' },
          { value: '9na Gen', label: '9na Gen' },
          { value: '10ma Gen', label: '10ma Gen' },
          { value: '11va Gen', label: '11va Gen' },
          { value: '12va Gen', label: '12va Gen' },
          { value: '13va Gen', label: '13va Gen' },
          { value: '14va Gen', label: '14va Gen' },
        ];
      case 'AMD':
        return [
          { value: 'Serie 3000', label: 'Serie 3000' },
          { value: 'Serie 4000', label: 'Serie 4000' },
          { value: 'Serie 5000', label: 'Serie 5000' },
          { value: 'Serie 6000', label: 'Serie 6000' },
          { value: 'Serie 7000', label: 'Serie 7000' },
          { value: 'Serie 8000', label: 'Serie 8000' },
        ];
      default:
        return [];
    }
  };

  // 1. CARGAR DATOS EXTERNOS
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const resMarcas = await api
          .get('/equipos/marcas')
          .catch(() => ({ data: [] }));
        setMarcasOptions(
          resMarcas.data.map((m) => ({ value: m.nombre, label: m.nombre })),
        );

        const resProv = await api
          .get('/proveedores')
          .catch(() => ({ data: [] }));
        setProveedoresOptions(
          resProv.data
            .filter((p) => p.activo)
            .map((p) => ({ value: p.id, label: p.razon_social })),
        );

        const resEmp = await api.get('/empresas').catch(() => ({ data: [] }));
        setEmpresasOptions(
          resEmp.data
            .filter((e) => e.estado === 'Activo' || e.activo)
            .map((e) => ({
              value: e.nombre || e.razon_social,
              label: e.nombre || e.razon_social,
            })),
        );
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
      let existingRam = '';
      let existingAlmacenamientoValor = '';
      let existingAlmacenamientoUnidad = 'GB';
      let existingProc = '';
      let otherSpecs = [];

      if (equipoToEdit.especificaciones) {
        Object.entries(equipoToEdit.especificaciones).forEach(([k, v]) => {
          const keyLower = k.toLowerCase().trim();
          if (keyLower === 'ram') existingRam = v;
          else if (keyLower === 'procesador') existingProc = v;
          else if (keyLower === 'almacenamiento') {
            // Extraer solo los números para el valor
            existingAlmacenamientoValor = String(v).replace(/[^\d.]/g, '');
            // Determinar si es TB o GB
            if (String(v).toUpperCase().includes('TB'))
              existingAlmacenamientoUnidad = 'TB';
          } else otherSpecs.push({ key: k, value: v });
        });
      }

      setFormData({
        marca: equipoToEdit.marca || '',
        modelo: equipoToEdit.modelo || '',
        serie: equipoToEdit.serie || '',
        estado: equipoToEdit.estado || 'operativo',
        fecha_compra: equipoToEdit.fecha_compra
          ? equipoToEdit.fecha_compra.split('T')[0]
          : '',
        empresa: equipoToEdit.empresa || '',
        condicion_equipo: equipoToEdit.proveedor_id ? 'alquilado' : 'propio',
        proveedor_id: equipoToEdit.proveedor_id || null,
        fecha_fin_alquiler: equipoToEdit.fecha_fin_alquiler
          ? equipoToEdit.fecha_fin_alquiler.split('T')[0]
          : '',
        ram: existingRam,
        almacenamiento_valor: existingAlmacenamientoValor,
        almacenamiento_unidad: existingAlmacenamientoUnidad,
        procesador: existingProc,
      });
      setSpecsList(otherSpecs);
    }
  }, [equipoToEdit]);

  // 3. EFECTO DEL CONSTRUCTOR DE PROCESADOR
  useEffect(() => {
    if (builderMarca || builderModelo || builderGen) {
      const parts = [
        builderMarca ? builderMarca.value : '',
        builderModelo ? builderModelo.value : '',
        builderGen ? builderGen.value : '',
      ].filter(Boolean);

      setFormData((prev) => ({
        ...prev,
        procesador: parts.join(' '),
      }));
    }
  }, [builderMarca, builderModelo, builderGen]);

  // --- HANDLERS ---
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleMarcaChange = (newValue) =>
    setFormData({ ...formData, marca: newValue ? newValue.value : '' });
  const handleEstadoChange = (newValue) =>
    setFormData({
      ...formData,
      estado: newValue ? newValue.value : 'operativo',
    });
  const handleProveedorChange = (newValue) =>
    setFormData({
      ...formData,
      proveedor_id: newValue ? newValue.value : null,
    });
  const handleEmpresaChange = (newValue) =>
    setFormData({ ...formData, empresa: newValue ? newValue.value : '' });

  const handleSelectChange = (selectedOption, actionMeta) => {
    setFormData({
      ...formData,
      [actionMeta.name]: selectedOption ? selectedOption.value : '',
    });
  };

  const handleCondicionChange = (newValue) => {
    const val = newValue ? newValue.value : 'propio';
    setFormData((prev) => ({
      ...prev,
      condicion_equipo: val,
      proveedor_id: val === 'propio' ? null : prev.proveedor_id,
      empresa: val === 'alquilado' ? '' : prev.empresa,
    }));
  };

  const handleBuilderMarcaChange = (selected) => {
    setBuilderMarca(selected);
    setBuilderModelo(null);
    setBuilderGen(null);
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

    if (formData.condicion_equipo === 'alquilado' && !formData.proveedor_id) {
      return toast.warning(
        'Debes seleccionar un proveedor para equipos alquilados',
      );
    }
    if (formData.condicion_equipo === 'propio' && !formData.empresa) {
      return toast.warning(
        'Debes seleccionar a qué empresa pertenece el equipo',
      );
    }

    // Construir JSON de especificaciones final
    const specsObject = specsList.reduce((acc, item) => {
      if (item.key && item.value) acc[item.key] = item.value;
      return acc;
    }, {});

    if (formData.ram) specsObject['Ram'] = formData.ram;

    // UNIR EL NÚMERO CON LA UNIDAD (GB/TB)
    if (formData.almacenamiento_valor) {
      specsObject['Almacenamiento'] =
        `${formData.almacenamiento_valor} ${formData.almacenamiento_unidad}`;
    }

    if (formData.procesador) specsObject['Procesador'] = formData.procesador;

    // Limpiar para no enviar variables sueltas al backend (se envían dentro de 'especificaciones')
    const {
      ram,
      almacenamiento_valor,
      almacenamiento_unidad,
      procesador,
      ...restFormData
    } = formData;
    const payload = { ...restFormData, especificaciones: specsObject };

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
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  // Estilos Select
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
      {/* --- SECCIÓN: CONDICIÓN DEL EQUIPO --- */}
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

        {formData.condicion_equipo === 'alquilado' ? (
          <div className='input-group'>
            <label
              style={{
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
                color: '#c2410c',
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
              placeholder='Seleccione Proveedor...'
              isLoading={loadingData}
            />
          </div>
        ) : (
          <div className='input-group'>
            <label
              style={{
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
                color: '#4f46e5',
              }}
            >
              <FaBuilding /> Empresa Propietaria *
            </label>
            <Select
              options={empresasOptions}
              value={empresasOptions.find(
                (op) => op.value === formData.empresa,
              )}
              onChange={handleEmpresaChange}
              styles={customSelectStyles}
              placeholder='Seleccione Empresa...'
              isLoading={loadingData}
            />
          </div>
        )}
      </div>

      <div
        className='form-row'
        style={{ marginTop: '0.5rem' }}
      >
        {formData.condicion_equipo === 'alquilado' ? (
          <>
            <div className='input-group'>
              <label>
                <FaCalendarAlt style={{ color: '#94a3b8' }} /> Inicio del
                Alquiler
              </label>
              <input
                type='date'
                name='fecha_compra'
                value={formData.fecha_compra}
                onChange={handleChange}
              />
            </div>
            <div className='input-group'>
              <label>
                <FaCalendarAlt style={{ color: '#94a3b8' }} /> Fin del Contrato
                (Opcional)
              </label>
              <input
                type='date'
                name='fecha_fin_alquiler'
                value={formData.fecha_fin_alquiler}
                onChange={handleChange}
              />
            </div>
          </>
        ) : (
          <div className='input-group'>
            <label>
              <FaCalendarAlt style={{ color: '#94a3b8' }} /> Fecha de Compra
            </label>
            <input
              type='date'
              name='fecha_compra'
              value={formData.fecha_compra}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      <hr style={{ margin: '1rem 0', borderTop: '1px solid #e2e8f0' }} />

      {/* --- DATOS DEL EQUIPO --- */}
      <div className='form-row'>
        <div className='input-group'>
          <label>Marca</label>
          <CreatableSelect
            isClearable
            isDisabled={loadingData}
            onChange={handleMarcaChange}
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
        {equipoToEdit && (
          <div className='input-group'>
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
      </div>

      {/* --- SPECS PRINCIPALES (RAM, ALMACENAMIENTO Y PROCESADOR) --- */}
      <div className='specs-section'>
        <h4>Especificaciones Principales</h4>

        {/* Fila 1: RAM y Almacenamiento */}
        <div className='form-row'>
          <div className='input-group'>
            <label>Memoria RAM (GB)</label>
            <input
              type='number'
              name='ram'
              value={formData.ram}
              onChange={handleChange}
              placeholder='Ej: 8, 16, 32'
            />
          </div>
          <div className='input-group'>
            <label>Almacenamiento</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type='number'
                name='almacenamiento_valor'
                value={formData.almacenamiento_valor}
                onChange={handleChange}
                placeholder='Ej: 512'
                style={{ flex: 1, minHeight: '38px' }}
              />
              <div style={{ width: '90px' }}>
                <Select
                  name='almacenamiento_unidad'
                  options={unidadAlmacenamientoOptions}
                  value={unidadAlmacenamientoOptions.find(
                    (op) => op.value === formData.almacenamiento_unidad,
                  )}
                  onChange={handleSelectChange}
                  styles={customSelectStyles}
                  isSearchable={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fila 2: Procesador */}
        <div
          className='form-row-all'
          style={{ marginTop: '10px', width: '100%' }}
        >
          <div
            className='input-group'
            style={{ width: '100%' }}
          >
            <label>Procesador</label>
            <input
              name='procesador'
              value={formData.procesador}
              onChange={handleChange}
              placeholder='Ej: Intel Core i7 10ma Gen'
            />
          </div>
        </div>

        {/* --- GENERADOR FÁCIL DE PROCESADOR --- */}
        <div className='procesador-builder'>
          <span className='builder-title'>
            <FaMicrochip /> Ingresa Datos de Procesador
          </span>
          <div className='builder-grid'>
            <Select
              options={marcaProcOptions}
              value={builderMarca}
              onChange={handleBuilderMarcaChange}
              placeholder='Marca...'
              styles={customSelectStyles}
              isClearable
            />
            <Select
              options={getModeloOptions(builderMarca?.value)}
              value={builderModelo}
              onChange={setBuilderModelo}
              placeholder='Modelo...'
              styles={customSelectStyles}
              isDisabled={!builderMarca}
              isClearable
            />
            <Select
              options={getGenOptions(builderMarca?.value)}
              value={builderGen}
              onChange={setBuilderGen}
              placeholder='Generación...'
              styles={customSelectStyles}
              isDisabled={!builderMarca || builderMarca?.value === 'Apple'}
              isClearable
            />
          </div>
        </div>

        <h4 style={{ marginTop: '1.5rem' }}>
          Otras Especificaciones (Opcional)
        </h4>
        {specsList.map((spec, index) => (
          <div
            className='spec-row'
            key={index}
          >
            <input
              placeholder='Ej: Tarjeta de Video'
              value={spec.key}
              onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
            />
            <input
              placeholder='Ej: RTX 3060 4GB'
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
          <FaPlus /> Agregar nuevo componente
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
