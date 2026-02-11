import React from 'react';
import {
  FaHistory,
  FaCheck,
  FaTimes,
  FaFilePdf,
  FaUpload,
  FaBan,
  FaEye,
  FaEnvelope,
  FaExclamationTriangle,
  FaCalendarAlt, // <-- Agregado para el diseño de fecha
} from 'react-icons/fa';

const EntregaTable = ({
  historial,
  onVerPdfOriginal,
  onVerFirmado,
  onSubirClick,
  onInvalidar,
}) => {
  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(
      isoString.endsWith('Z') ? isoString : `${isoString}Z`,
    );
    return date.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className='table-container'>
      <div className='table-header-title'>
        <h3>
          <FaHistory /> Últimas Entregas
        </h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Equipo Entregado</th>
            <th>Usuario</th>
            <th className='center'>Carg.</th>
            <th className='center'>Correo</th>
            <th className='center'>Acta</th>
            <th className='center'>Firma</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((h) => (
            <tr key={h.id}>
              {/* FECHA */}
              <td>
                <div className='email-cell'>
                  <FaCalendarAlt /> {formatDateTime(h.fecha_movimiento)}
                </div>
              </td>

              {/* EQUIPO */}
              <td>
                <div className='info-cell'>
                  <span className='name'>{h.modelo}</span>
                  <span className='audit-text'>S/N: {h.serie}</span>
                </div>
              </td>

              {/* USUARIO */}
              <td>
                <div className='info-cell'>
                  <span className='name'>
                    {h.empleado_nombre} {h.empleado_apellido}
                  </span>
                </div>
              </td>

              {/* CARGADOR */}
              <td className='center'>
                {h.cargador ? (
                  <FaCheck className='check-icon' />
                ) : (
                  <span style={{ color: '#cbd5e1' }}>-</span>
                )}
              </td>

              {/* CORREO */}
              <td className='center'>
                {h.correo_enviado === true && (
                  <FaEnvelope
                    className='mail-success'
                    title='Enviado'
                  />
                )}
                {h.correo_enviado === false && (
                  <FaExclamationTriangle
                    className='mail-error'
                    title='Error'
                  />
                )}
                {h.correo_enviado === null && (
                  <span style={{ color: '#cbd5e1' }}>-</span>
                )}
              </td>

              {/* PDF GENERADO */}
              <td className='center'>
                <div className='actions-cell'>
                  <button
                    onClick={() => onVerPdfOriginal(h)}
                    className='action-btn pdf-btn'
                    title='Ver Original'
                  >
                    <FaFilePdf />
                  </button>
                </div>
              </td>

              {/* FIRMA */}
              <td className='center'>
                <div className='actions-cell'>
                  {!h.pdf_firmado_url && (
                    <button
                      onClick={() => onSubirClick(h.id)}
                      className='btn-upload'
                    >
                      <FaUpload /> Subir
                    </button>
                  )}

                  {h.pdf_firmado_url && h.firma_valida !== false && (
                    <>
                      <button
                        onClick={() => onVerFirmado(h.pdf_firmado_url)}
                        className='action-btn view'
                        title='Ver Firmado'
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => onInvalidar(h.id)}
                        className='action-btn delete'
                        title='Invalidar'
                      >
                        <FaBan />
                      </button>
                    </>
                  )}

                  {h.pdf_firmado_url && h.firma_valida === false && (
                    <button
                      onClick={() => onSubirClick(h.id)}
                      className='btn-upload re-upload'
                    >
                      <FaUpload /> Re-subir
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EntregaTable;
