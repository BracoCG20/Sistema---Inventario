import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Select from 'react-select';
import {
  FaFilePdf,
  FaSave,
  FaCalendarCheck,
  FaHistory,
  FaKey,
  FaExternalLinkAlt,
  FaSync,
  FaCheckCircle,
  FaEye, // <--- Nuevo
  FaDownload, // <--- Nuevo
  FaTrashAlt, // <--- Nuevo
  FaFileImage, // <--- Nuevo
} from 'react-icons/fa';

import './AddServicioForm.scss';
import './PagoServicioModal.scss';

const PagoServicioModal = ({ servicio, onClose }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fecha_pago: new Date().toISOString().split('T')[0],
    monto_pagado: servicio?.precio || '',
    moneda: servicio?.moneda || 'USD',
    periodo_pagado: '',
    nueva_fecha_proximo_pago: '',
  });

  const [pdfDetectado, setPdfDetectado] = useState(null);
  const [archivo, setArchivo] = useState(null);
  // Estado para la URL temporal de previsualización
  const [previewUrl, setPreviewUrl] = useState(null);

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
      toast.error('Error al cargar historial');
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

  // Limpiar la URL del objeto cuando el componente se desmonte o cambie el archivo
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSyncInvoice = async () => {
    setSyncing(true);
    setPdfDetectado(null);

    try {
      const res = await api.post(`/servicios/${servicio.id}/sync-invoice`);
      const data = res.data;

      if (data.conectado) {
        toast.success('¡Datos sincronizados correctamente!');

        if (data.datos) {
          setFormData((prev) => ({
            ...prev,
            fecha_pago: data.datos.fecha
              ? data.datos.fecha.split('T')[0]
              : prev.fecha_pago,
            monto_pagado: data.datos.monto || prev.monto_pagado,
            moneda: data.datos.moneda || prev.moneda,
            periodo_pagado: data.datos.periodo || prev.periodo_pagado,
          }));
        }

        if (data.pdf_url) {
          setPdfDetectado(data.pdf_url);
          toast.info('Factura PDF encontrada.');
        } else {
          toast.info(
            "Metricool no entrega el PDF vía API. Usa 'Ir al Portal' para descargarlo.",
            { autoClose: 5000 },
          );
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al sincronizar o credenciales inválidas.');
    } finally {
      setSyncing(false);
    }
  };

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
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      // Creamos una URL temporal para ver el archivo localmente
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleRemoveFile = () => {
    setArchivo(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monto_pagado || !formData.periodo_pagado) {
      return toast.warning('Completa el monto y el periodo.');
    }

    setLoading(true);
    const toastId = toast.loading('Registrando pago...');

    const form = new FormData();
    Object.keys(formData).forEach((key) => form.append(key, formData[key]));

    if (archivo) {
      form.append('comprobante', archivo);
    } else if (pdfDetectado) {
      form.append('pdf_url_externa', pdfDetectado);
    }

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

      handleRemoveFile(); // Limpia archivo y preview
      setPdfDetectado(null);
      setFormData((prev) => ({ ...prev, periodo_pagado: '' }));
      fetchPagos();
    } catch (error) {
      toast.update(toastId, {
        render: 'Error al registrar ❌',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const verComprobante = (url) => {
    const link = url.startsWith('http') ? url : `http://localhost:4000${url}`;
    window.open(link, '_blank');
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

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: state.isDisabled ? '#f1f5f9' : 'rgba(255, 255, 255, 0.9)',
      borderColor: state.isFocused ? '#7c3aed' : '#cbd5e1',
      borderRadius: '8px',
      minHeight: '42px',
      boxShadow: state.isFocused ? '0 0 0 1px #7c3aed' : 'none',
      '&:hover': { borderColor: state.isDisabled ? '#cbd5e1' : '#7c3aed' },
    }),
    singleValue: (provided) => ({ ...provided, color: '#334155' }),
  };

  if (!servicio) return null;

  return (
    <div className='pago-modal-container'>
      {/* --- BANNER DE ACCESO --- */}
      {servicio.usuario_acceso && (
        <div className='credentials-banner'>
          <div className='creds-info'>
            <h4>
              <FaKey /> Credenciales de Acceso
            </h4>
            <div className='user-detail'>
              <strong>Usuario:</strong> {servicio.usuario_acceso}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {servicio.api_key && (
              <button
                onClick={handleSyncInvoice}
                disabled={syncing}
                className='btn-portal'
                style={{ background: '#0ea5e9' }}
                title='Sincronizar datos de facturación'
              >
                {syncing ? <FaSync className='fa-spin' /> : <FaSync />}
                {syncing ? ' Buscando...' : ' Sincronizar Datos'}
              </button>
            )}

            <button
              onClick={() => window.open(servicio.url_acceso, '_blank')}
              className='btn-portal'
            >
              Ir al Portal <FaExternalLinkAlt size={12} />
            </button>
          </div>
        </div>
      )}

      {/* --- FORMULARIO --- */}
      <div className='modal-card padding-content'>
        <h4 className='section-title'>
          <FaCalendarCheck /> Registrar Nuevo Pago
        </h4>

        <form
          className='equipo-form'
          onSubmit={handleSubmit}
          style={{ padding: 0, maxHeight: 'none', overflow: 'visible' }}
        >
          {/* AVISO DE PDF DETECTADO API */}
          {pdfDetectado && (
            <div className='alert-box success'>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaCheckCircle /> PDF detectado automáticamente vía API.
              </div>
              <a
                href={pdfDetectado}
                target='_blank'
                rel='noreferrer'
                className='link-view'
              >
                Ver PDF
              </a>
            </div>
          )}

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
              />
            </div>
          </div>

          {/* --- SECCIÓN DE SUBIDA DE ARCHIVO CON PREVISUALIZACIÓN --- */}
          <div className='input-group'>
            <label>Comprobante / Invoice (PDF o Imagen)</label>

            {/* Si NO hay archivo seleccionado NI detectado, mostramos el input */}
            {!archivo && !pdfDetectado && (
              <input
                type='file'
                accept='.pdf,image/*'
                ref={fileInputRef}
                onChange={handleFileChange}
                className='file-input-custom'
              />
            )}

            {/* Si HAY un archivo seleccionado manualmente, mostramos la tarjeta de vista previa */}
            {archivo && (
              <div className='file-preview-box'>
                <div className='file-info'>
                  {archivo.type.includes('image') ? (
                    <FaFileImage className='icon img' />
                  ) : (
                    <FaFilePdf className='icon pdf' />
                  )}
                  <div className='details'>
                    <span className='filename'>{archivo.name}</span>
                    <span className='filesize'>
                      {(archivo.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <div className='file-actions'>
                  {/* Botón Ver */}
                  <button
                    type='button'
                    className='action-btn view'
                    onClick={() => window.open(previewUrl, '_blank')}
                    title='Vista Previa'
                  >
                    <FaEye />
                  </button>

                  {/* Botón Descargar (usando el blob local) */}
                  <a
                    href={previewUrl}
                    download={archivo.name}
                    className='action-btn download'
                    title='Descargar'
                  >
                    <FaDownload />
                  </a>

                  {/* Botón Eliminar */}
                  <button
                    type='button'
                    className='action-btn remove'
                    onClick={handleRemoveFile}
                    title='Quitar archivo'
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            )}

            {pdfDetectado && (
              <small
                style={{ color: '#059669', marginTop: '5px', display: 'block' }}
              >
                * Se usará el PDF importado automáticamente.
              </small>
            )}
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

      {/* --- HISTORIAL --- */}
      <div className='history-container'>
        <h4 className='history-header'>
          <FaHistory /> Historial de Pagos
        </h4>

        {pagos.length === 0 ? (
          <div className='empty-state'>
            Aún no hay pagos registrados para este servicio.
          </div>
        ) : (
          <div className='table-scroll'>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Período</th>
                  <th>Monto</th>
                  <th className='center'>Voucher</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td className='date'>{formatDate(pago.fecha_pago)}</td>
                    <td className='period'>{pago.periodo_pagado}</td>
                    <td className='amount'>
                      {pago.moneda} {Number(pago.monto_pagado).toFixed(2)}
                    </td>
                    <td className='center'>
                      {pago.comprobante_url ? (
                        <button
                          onClick={() => verComprobante(pago.comprobante_url)}
                          className='btn-ver-pdf'
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
