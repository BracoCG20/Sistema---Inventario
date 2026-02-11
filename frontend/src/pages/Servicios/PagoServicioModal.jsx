import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { FaFilePdf, FaSave, FaCalendarCheck, FaHistory } from 'react-icons/fa';
import './AddServicioForm.scss'; // Reutilizamos los estilos del formulario general

const PagoServicioModal = ({ servicio, onClose }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fecha_pago: new Date().toISOString().split('T')[0],
    monto_pagado: servicio?.precio || '',
    moneda: servicio?.moneda || 'USD',
    periodo_pagado: '',
    nueva_fecha_proximo_pago: '',
  });
  const [archivo, setArchivo] = useState(null);

  const monedaOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'PEN', label: 'PEN' },
  ];

  const fetchPagos = async () => {
    if (!servicio) return;
    try {
      const res = await api.get(`/servicios/${servicio.id}/pagos`);
      setPagos(res.data);
    } catch (error) {
      toast.error('Error al cargar el historial de pagos');
    }
  };

  useEffect(() => {
    fetchPagos();
    if (servicio?.fecha_proximo_pago) {
      const proxima = new Date(servicio.fecha_proximo_pago);
      proxima.setMonth(proxima.getMonth() + 1);
      setFormData((prev) => ({
        ...prev,
        nueva_fecha_proximo_pago: proxima.toISOString().split('T')[0],
      }));
    }
  }, [servicio]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    setFormData({
      ...formData,
      [actionMeta.name]: selectedOption ? selectedOption.value : null,
    });
  };

  const handleFileChange = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monto_pagado || !formData.periodo_pagado) {
      return toast.warning('Completa el monto y el periodo.');
    }

    setLoading(true);
    const toastId = toast.loading('Registrando pago y subiendo comprobante...');

    const form = new FormData();
    Object.keys(formData).forEach((key) => form.append(key, formData[key]));
    if (archivo) form.append('comprobante', archivo);

    try {
      await api.post(`/servicios/${servicio.id}/pagos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.update(toastId, {
        render: 'Pago registrado ✅',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });

      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFormData((prev) => ({ ...prev, periodo_pagado: '' }));
      fetchPagos();
    } catch (error) {
      toast.update(toastId, {
        render: 'Error al registrar pago ❌',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const verComprobante = (url) => {
    window.open(`http://localhost:4000${url}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(
      dateString.includes('T') ? dateString : `${dateString}T12:00:00Z`,
    );
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Estilos de React Select para que coincida con tus inputs
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: state.isDisabled ? '#f1f5f9' : 'rgba(255, 255, 255, 0.9)',
      borderColor: state.isFocused ? '#7c3aed' : '#cbd5e1',
      borderRadius: '8px',
      minHeight: '42px',
      boxShadow: state.isFocused ? '0 0 0 1px #7c3aed' : 'none',
      cursor: state.isDisabled ? 'not-allowed' : 'default',
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
    singleValue: (provided, state) => ({
      ...provided,
      color: state.isDisabled ? '#94a3b8' : '#334155',
    }),
  };

  if (!servicio) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* --- FORMULARIO DE REGISTRO --- */}
      <div
        style={{
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
        }}
      >
        <h4
          style={{
            margin: '0 0 1.5rem 0',
            color: '#1e293b',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaCalendarCheck color='#4f46e5' /> Registrar Nuevo Pago
        </h4>

        <form
          className='equipo-form'
          onSubmit={handleSubmit}
          style={{ padding: 0, maxHeight: 'none', overflow: 'visible' }}
        >
          <div className='form-row'>
            <div className='input-group'>
              <label>Fecha de Pago</label>
              <input
                type='date'
                name='fecha_pago'
                value={formData.fecha_pago}
                onChange={handleChange}
                style={{ minHeight: '42px' }}
                required
              />
            </div>

            <div className='input-group'>
              <label>Monto Pagado</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '100px' }}>
                  <Select
                    name='moneda'
                    options={monedaOptions}
                    value={monedaOptions.find(
                      (op) => op.value === formData.moneda,
                    )}
                    onChange={handleSelectChange}
                    styles={customSelectStyles}
                    isSearchable={false}
                  />
                </div>
                <input
                  type='number'
                  step='0.01'
                  name='monto_pagado'
                  value={formData.monto_pagado}
                  onChange={handleChange}
                  style={{ flex: 1, minHeight: '42px' }}
                  required
                />
              </div>
            </div>
          </div>

          <div className='form-row'>
            <div className='input-group'>
              <label>Período</label>
              <input
                name='periodo_pagado'
                value={formData.periodo_pagado}
                onChange={handleChange}
                placeholder='Ej: Febrero 2026'
                required
              />
            </div>
            <div className='input-group'>
              <label>Actualizar Próximo Cobro a:</label>
              <input
                type='date'
                name='nueva_fecha_proximo_pago'
                value={formData.nueva_fecha_proximo_pago}
                onChange={handleChange}
                title='Actualizará la fecha en la tabla principal'
              />
            </div>
          </div>

          <div className='input-group'>
            <label>Comprobante / Invoice (PDF o Imagen)</label>
            <input
              type='file'
              accept='.pdf,image/*'
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{
                padding: '8px',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                cursor: 'pointer',
              }}
            />
          </div>

          <button
            type='submit'
            className='btn-submit'
            disabled={loading}
          >
            <FaSave style={{ marginRight: '8px' }} />{' '}
            {loading ? 'Guardando...' : 'Guardar Comprobante'}
          </button>
        </form>
      </div>

      {/* --- TABLA DE HISTORIAL --- */}
      <div>
        <h4
          style={{
            margin: '0 0 1rem 0',
            color: '#1e293b',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaHistory color='#4f46e5' /> Historial de Pagos Anteriores
        </h4>

        {pagos.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2.5rem',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
              color: '#64748b',
            }}
          >
            Aún no hay pagos registrados para este servicio.
          </div>
        ) : (
          <div
            style={{
              maxHeight: '250px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: 'white',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
              }}
            >
              <thead
                style={{
                  background: '#eef2ff',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: '#4338ca',
                      fontWeight: '700',
                    }}
                  >
                    Fecha
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: '#4338ca',
                      fontWeight: '700',
                    }}
                  >
                    Período
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      color: '#4338ca',
                      fontWeight: '700',
                    }}
                  >
                    Monto
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: '#4338ca',
                      fontWeight: '700',
                    }}
                  >
                    Voucher
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr
                    key={pago.id}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td
                      style={{
                        padding: '12px',
                        color: '#334155',
                        fontWeight: '600',
                      }}
                    >
                      {formatDate(pago.fecha_pago)}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {pago.periodo_pagado}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        color: '#059669',
                        fontWeight: '600',
                      }}
                    >
                      {pago.moneda} {Number(pago.monto_pagado).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {pago.comprobante_url ? (
                        <button
                          onClick={() => verComprobante(pago.comprobante_url)}
                          style={{
                            background: '#fee2e2',
                            color: '#ef4444',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '600',
                          }}
                        >
                          <FaFilePdf /> Ver
                        </button>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagoServicioModal;
