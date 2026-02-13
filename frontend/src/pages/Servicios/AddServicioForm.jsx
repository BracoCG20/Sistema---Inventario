import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { FaCloudUploadAlt, FaSave } from 'react-icons/fa';
import './AddServicioForm.scss';

const AddServicioForm = ({ onSuccess, servicioToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [empresasOptions, setEmpresasOptions] = useState([]);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    moneda: 'USD',
    frecuencia_pago: 'Mensual',
    fecha_proximo_pago: '',
    metodo_pago: '',
    empresa_facturacion_id: '',
    num_tarjeta_facturacion: '',
    cci_facturacion: '',
    empresa_usuaria_id: '',
    num_tarjeta_usuaria: '',
    cci_usuaria: '',
    licencias_totales: 0,
    licencias_usadas: 0,
    estado: 'Activo',
    api_key: '',
    url_acceso: '',
    usuario_acceso: '',
    password_acceso: '',
  });

  const monedaOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'PEN', label: 'PEN (S/)' },
    { value: 'EUR', label: 'EUR (€)' },
  ];

  const frecuenciaOptions = [
    { value: 'Mensual', label: 'Mensual' },
    { value: 'Anual', label: 'Anual' },
    { value: 'Trimestral', label: 'Trimestral' },
    { value: 'Único', label: 'Pago Único' },
  ];

  const metodoPagoOptions = [
    { value: 'BCP', label: 'BCP' },
    { value: 'Interbank', label: 'Interbank' },
    { value: 'BBVA', label: 'BBVA' },
    { value: 'Transferencia', label: 'Transferencia' },
  ];

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const res = await api.get('/empresas');
        const options = res.data
          .filter((emp) => emp.activo)
          .map((emp) => ({
            value: emp.id,
            label: emp.razon_social,
          }));
        setEmpresasOptions(options);
      } catch (error) {
        toast.error('Error al cargar empresas');
      }
    };
    fetchEmpresas();
  }, []);

  useEffect(() => {
    if (servicioToEdit) {
      setFormData({
        nombre: servicioToEdit.nombre ?? '',
        descripcion: servicioToEdit.descripcion ?? '',
        precio: servicioToEdit.precio ?? '',
        moneda: servicioToEdit.moneda ?? 'USD',
        frecuencia_pago: servicioToEdit.frecuencia_pago ?? 'Mensual',
        fecha_proximo_pago: servicioToEdit.fecha_proximo_pago
          ? servicioToEdit.fecha_proximo_pago.split('T')[0]
          : '',
        metodo_pago: servicioToEdit.metodo_pago ?? '',
        empresa_facturacion_id: servicioToEdit.empresa_facturacion_id ?? '',
        num_tarjeta_facturacion: servicioToEdit.num_tarjeta_facturacion ?? '',
        cci_facturacion: servicioToEdit.cci_facturacion ?? '',
        empresa_usuaria_id: servicioToEdit.empresa_usuaria_id ?? '',
        num_tarjeta_usuaria: servicioToEdit.num_tarjeta_usuaria ?? '',
        cci_usuaria: servicioToEdit.cci_usuaria ?? '',
        licencias_totales: servicioToEdit.licencias_totales ?? 0,
        licencias_usadas: servicioToEdit.licencias_usadas ?? 0,
        estado: servicioToEdit.estado ?? 'Activo',
        url_acceso: servicioToEdit.url_acceso ?? '',
        usuario_acceso: servicioToEdit.usuario_acceso ?? '',
        password_acceso: '',
        api_key: servicioToEdit.api_key ?? '',
      });
    }
  }, [servicioToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    setFormData({
      ...formData,
      [actionMeta.name]: selectedOption ? selectedOption.value : null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.frecuencia_pago) {
      return toast.warning('Por favor, completa los campos obligatorios.');
    }

    setLoading(true);
    const toastId = toast.loading(
      servicioToEdit ? 'Actualizando...' : 'Guardando...',
    );

    try {
      if (servicioToEdit) {
        await api.put(`/servicios/${servicioToEdit.id}`, formData);
        toast.update(toastId, {
          render: 'Servicio actualizado ✅',
          type: 'success',
          isLoading: false,
          autoClose: 2000,
        });
      } else {
        await api.post('/servicios', formData);
        toast.update(toastId, {
          render: 'Servicio registrado ✅',
          type: 'success',
          isLoading: false,
          autoClose: 2000,
        });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.update(toastId, {
        render: 'Error al guardar ❌',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!servicioToEdit;

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: state.isDisabled ? '#f1f5f9' : '#fff',
      borderColor: state.isFocused ? '#7c3aed' : '#cbd5e1',
      borderRadius: '8px',
      minHeight: '42px',
      boxShadow: state.isFocused ? '0 0 0 1px #7c3aed' : 'none',
      '&:hover': { borderColor: state.isDisabled ? '#cbd5e1' : '#7c3aed' },
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
      <h4 className='form-section-title'>Información General</h4>
      <div className='form-row-all'>
        <div className='input-group'>
          <label>Nombre del Servicio *</label>
          <input
            name='nombre'
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder='Ej: Google Workspace'
          />
        </div>
      </div>
      <div className='form-row-all'>
        <div className='input-group'>
          <label>Descripción</label>
          <input
            name='descripcion'
            value={formData.descripcion}
            onChange={handleChange}
            placeholder='Ej: Correos corporativos'
          />
        </div>
      </div>

      <hr style={{ margin: '0.2rem 0', borderTop: '1px solid #f1f5f9' }} />

      <h4 className='form-section-title'>Facturación</h4>
      <div className='form-row'>
        <div className='input-group'>
          <label>Precio y Moneda</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '120px' }}>
              <Select
                name='moneda'
                options={monedaOptions}
                value={monedaOptions.find((op) => op.value === formData.moneda)}
                onChange={handleSelectChange}
                styles={customSelectStyles}
                isSearchable={false}
              />
            </div>
            <input
              type='number'
              step='0.01'
              name='precio'
              value={formData.precio}
              onChange={handleChange}
              placeholder='0.00'
              style={{ flex: 1 }}
            />
          </div>
        </div>
        <div className='input-group'>
          <label>Frecuencia de Pago *</label>
          <Select
            name='frecuencia_pago'
            options={frecuenciaOptions}
            value={frecuenciaOptions.find(
              (op) => op.value === formData.frecuencia_pago,
            )}
            onChange={handleSelectChange}
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>Método de Pago</label>
          <CreatableSelect
            name='metodo_pago'
            options={metodoPagoOptions}
            value={
              formData.metodo_pago
                ? { value: formData.metodo_pago, label: formData.metodo_pago }
                : null
            }
            onChange={handleSelectChange}
            styles={customSelectStyles}
            placeholder='Seleccione o escriba'
            isClearable
          />
        </div>
        <div className='input-group'>
          <label>Próximo Pago Estimado</label>
          <input
            type='date'
            name='fecha_proximo_pago'
            value={formData.fecha_proximo_pago}
            onChange={handleChange}
          />
        </div>
      </div>

      <hr style={{ margin: '0.2rem 0', borderTop: '1px solid #f1f5f9' }} />

      <h4 className='form-section-title'>Asignación y Datos Bancarios</h4>
      <div className='form-row'>
        {/* BLOQUE EMPRESA FACTURA */}
        <div className='input-group company-block'>
          <label
            style={{
              color: '#4f46e5',
              fontWeight: 'bold',
              marginBottom: '10px',
            }}
          >
            Empresa que Factura
          </label>
          <Select
            name='empresa_facturacion_id'
            options={empresasOptions}
            value={empresasOptions.find(
              (op) => op.value === formData.empresa_facturacion_id,
            )}
            onChange={handleSelectChange}
            styles={customSelectStyles}
            placeholder='Seleccione...'
            isClearable
          />
          <div className='bank-details'>
            <div className='field'>
              <label>N° de Tarjeta / Cuenta</label>
              <input
                name='num_tarjeta_facturacion'
                value={formData.num_tarjeta_facturacion}
                onChange={handleChange}
                placeholder='4550 ....'
              />
            </div>
            <div className='field'>
              <label>CCI (Cuenta Interbancaria)</label>
              <input
                name='cci_facturacion'
                value={formData.cci_facturacion}
                onChange={handleChange}
                placeholder='002-191...'
              />
            </div>
          </div>
        </div>

        {/* BLOQUE EMPRESA USUARIA */}
        <div className='input-group company-block'>
          <label
            style={{
              color: '#059669',
              fontWeight: 'bold',
              marginBottom: '10px',
            }}
          >
            Empresa que Usa
          </label>
          <Select
            name='empresa_usuaria_id'
            options={empresasOptions}
            value={empresasOptions.find(
              (op) => op.value === formData.empresa_usuaria_id,
            )}
            onChange={handleSelectChange}
            styles={customSelectStyles}
            placeholder='Seleccione...'
            isClearable
          />
          <div className='bank-details'>
            <div className='field'>
              <label>N° de Tarjeta / Cuenta</label>
              <input
                name='num_tarjeta_usuaria'
                value={formData.num_tarjeta_usuaria}
                onChange={handleChange}
                placeholder='4550 ....'
              />
            </div>
            <div className='field'>
              <label>CCI (Cuenta Interbancaria)</label>
              <input
                name='cci_usuaria'
                value={formData.cci_usuaria}
                onChange={handleChange}
                placeholder='002-191...'
              />
            </div>
          </div>
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>Licencias Compradas (Total)</label>
          <input
            type='number'
            name='licencias_totales'
            value={formData.licencias_totales}
            onChange={handleChange}
            min='0'
          />
        </div>
        <div className='input-group'>
          <label>Licencias en Uso</label>
          <input
            type='number'
            name='licencias_usadas'
            value={formData.licencias_usadas}
            onChange={handleChange}
            min='0'
          />
        </div>
      </div>

      <hr style={{ margin: '0.2rem 0', borderTop: '1px solid #f1f5f9' }} />

      <button
        type='submit'
        className='btn-submit'
        disabled={loading}
      >
        {isEdit ? (
          <FaSave style={{ marginRight: '8px' }} />
        ) : (
          <FaCloudUploadAlt style={{ marginRight: '8px' }} />
        )}
        {isEdit ? 'Guardar Cambios' : 'Registrar Servicio'}
      </button>
    </form>
  );
};

export default AddServicioForm;
