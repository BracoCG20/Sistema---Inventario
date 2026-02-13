import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import {
  FaSave,
  FaTimes,
  FaFileUpload,
  FaFileAlt,
  FaEye,
  FaDownload,
  FaTrash,
} from 'react-icons/fa';
import './AlquilerForm.scss';

const AlquilerForm = ({ onSubmit, initialData, equipos, onClose }) => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);

  const [formData, setFormData] = useState({
    equipo_id: '',
    cliente_nombre: '',
    cliente_documento: '',
    cliente_telefono: '',
    precio_alquiler: '',
    moneda: 'USD',
    frecuencia_pago: 'Mensual',
    fecha_inicio: '',
    fecha_fin: '',
    observaciones: '',
  });

  useEffect(() => {
    if (initialData) {
      // Usamos el operador de fusión nula (??) que es estricto para evitar undefined
      setFormData({
        equipo_id: initialData.equipo_id ?? '',
        cliente_nombre: initialData.cliente_nombre ?? '',
        cliente_documento: initialData.cliente_documento ?? '',
        cliente_telefono: initialData.cliente_telefono ?? '',
        precio_alquiler: initialData.precio_alquiler ?? '',
        moneda: initialData.moneda ?? 'USD',
        frecuencia_pago: initialData.frecuencia_pago ?? 'Mensual',
        fecha_inicio: initialData.fecha_inicio
          ? initialData.fecha_inicio.split('T')[0]
          : '',
        fecha_fin: initialData.fecha_fin
          ? initialData.fecha_fin.split('T')[0]
          : '',
        observaciones: initialData.observaciones ?? '',
      });

      if (initialData.factura_url) {
        setExistingFileUrl(initialData.factura_url);
      } else {
        setExistingFileUrl(null);
      }
    } else {
      setFormData({
        equipo_id: '',
        cliente_nombre: '',
        cliente_documento: '',
        cliente_telefono: '',
        precio_alquiler: '',
        moneda: 'USD',
        frecuencia_pago: 'Mensual',
        fecha_inicio: '',
        fecha_fin: '',
        observaciones: '',
      });
      setFile(null);
      setExistingFileUrl(null);
    }
  }, [initialData]);

  const equipoOptions = equipos.map((eq) => ({
    value: eq.id,
    label: `${eq.marca} ${eq.modelo} - ${eq.serie}`,
  }));

  const monedaOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'PEN', label: 'PEN (S/)' },
  ];

  const frecuenciaOptions = [
    { value: 'Mensual', label: 'Mensual' },
    { value: 'Semestral', label: 'Semestral' },
    { value: 'Anual', label: 'Anual' },
    { value: 'Unico', label: 'Pago Único' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    setFormData({
      ...formData,
      [actionMeta.name]: selectedOption ? selectedOption.value : '',
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExistingFileUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setExistingFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, file, !existingFileUrl && initialData?.factura_url);
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '45px',
      height: '45px',
      borderColor: state.isFocused ? '#8b5cf6' : '#cbd5e1',
      borderRadius: '8px',
      boxShadow: state.isFocused
        ? '0 0 0 3px rgba(139, 92, 246, 0.15)'
        : 'none',
      '&:hover': { borderColor: '#8b5cf6' },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 14px',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      padding: '0px',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '45px',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1f2937',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#8b5cf6'
        : state.isFocused
          ? '#f3f4f6'
          : 'transparent',
      color: state.isSelected ? 'white' : '#1f2937',
      cursor: 'pointer',
    }),
  };

  const getSelectedOption = (options, value) =>
    options.find((op) => op.value === value) || null;

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  return (
    <form
      onSubmit={handleSubmit}
      className='form-grid'
    >
      <div className='form-group full-width'>
        <label>Equipo (Solo Propios)</label>
        <Select
          name='equipo_id'
          options={equipoOptions}
          value={getSelectedOption(equipoOptions, formData.equipo_id)}
          onChange={handleSelectChange}
          placeholder='-- Buscar Equipo --'
          styles={customStyles}
          isDisabled={!!initialData}
          required
        />
      </div>

      <div className='form-group full-width'>
        <label>Nombre o Razón Social del Cliente</label>
        <input
          type='text'
          name='cliente_nombre'
          value={formData.cliente_nombre}
          onChange={handleChange}
          placeholder='Nombre del cliente o empresa...'
          required
        />
      </div>

      <div className='form-group-row'>
        <div className='form-group'>
          <label>DNI / RUC</label>
          <input
            type='text'
            name='cliente_documento'
            value={formData.cliente_documento}
            onChange={handleChange}
            placeholder='Opcional'
          />
        </div>
        <div className='form-group'>
          <label>Teléfono de Contacto</label>
          <input
            type='text'
            name='cliente_telefono'
            value={formData.cliente_telefono}
            onChange={handleChange}
            placeholder='Opcional'
          />
        </div>
      </div>

      <div className='form-group-row'>
        <div className='form-group'>
          <label>Precio Alquiler</label>
          <input
            type='number'
            name='precio_alquiler'
            step='0.01'
            value={formData.precio_alquiler}
            onChange={handleChange}
            placeholder='0.00'
            required
          />
        </div>
        <div className='form-group'>
          <label>Moneda</label>
          <Select
            name='moneda'
            options={monedaOptions}
            value={getSelectedOption(monedaOptions, formData.moneda)}
            onChange={handleSelectChange}
            styles={customStyles}
            isSearchable={false}
          />
        </div>
      </div>

      <div className='form-group full-width'>
        <label>Frecuencia de Pago</label>
        <Select
          name='frecuencia_pago'
          options={frecuenciaOptions}
          value={getSelectedOption(frecuenciaOptions, formData.frecuencia_pago)}
          onChange={handleSelectChange}
          styles={customStyles}
          isSearchable={false}
        />
      </div>

      <div className='form-group-row'>
        <div className='form-group'>
          <label>Fecha Inicio</label>
          <input
            type='date'
            name='fecha_inicio'
            value={formData.fecha_inicio}
            onChange={handleChange}
            required
          />
        </div>
        <div className='form-group'>
          <label>Fecha Fin (Opcional)</label>
          <input
            type='date'
            name='fecha_fin'
            value={formData.fecha_fin}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-group full-width'>
        <label>Observaciones del Contrato</label>
        <textarea
          name='observaciones'
          rows='3'
          value={formData.observaciones}
          onChange={handleChange}
          placeholder='Detalles adicionales...'
        ></textarea>
      </div>

      {/* --- SECCIÓN DE DOCUMENTO / FACTURA --- */}
      <div className='form-group full-width file-upload-group'>
        <label>Adjuntar Documento / Contrato (Opcional)</label>

        {file || existingFileUrl ? (
          <div className='file-preview-box'>
            <div className='file-info'>
              <FaFileAlt className='icon-pdf' />
              <span
                className='file-name'
                title={file ? file.name : existingFileUrl}
              >
                {file ? file.name : existingFileUrl}
              </span>
            </div>
            <div className='file-actions'>
              {existingFileUrl && !file && (
                <>
                  <a
                    href={`${baseUrl}/uploads/${existingFileUrl}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='btn-action view'
                    title='Ver archivo'
                  >
                    <FaEye />
                  </a>
                  <a
                    href={`${baseUrl}/uploads/${existingFileUrl}`}
                    download
                    className='btn-action download'
                    title='Descargar'
                  >
                    <FaDownload />
                  </a>
                </>
              )}
              <button
                type='button'
                onClick={handleRemoveFile}
                className='btn-action delete'
                title='Quitar archivo'
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ) : (
          <div className='upload-zone-form'>
            <input
              type='file'
              id='contrato-file'
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <label
              htmlFor='contrato-file'
              className='upload-label-form'
            >
              <FaFileUpload />
              <span>Click aquí para subir comprobante</span>
              <small>Soporta PDF, JPG o PNG (Max 5MB)</small>
            </label>
          </div>
        )}
      </div>

      <div className='form-actions'>
        <button
          type='button'
          className='btn-cancel'
          onClick={onClose}
        >
          <FaTimes /> Cancelar
        </button>
        <button
          type='submit'
          className='btn-submit'
        >
          <FaSave /> Guardar Contrato
        </button>
      </div>
    </form>
  );
};

export default AlquilerForm;
