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
    <div className='table-card'>
      <h3>
        <FaHistory /> Últimas Entregas
      </h3>
      <table>
        <thead>
          <tr>
            {/* 1. FECHA */}
            <th>Fecha y Hora</th>

            {/* 2. EQUIPO (Modelo y Serie) */}
            <th>Equipo Entregado</th>

            {/* 3. USUARIO */}
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
                <span className='date-text'>
                  {formatDateTime(h.fecha_movimiento)}
                </span>
              </td>

              {/* EQUIPO */}
              <td>
                <strong>{h.modelo}</strong>
                <span className='text-muted'>S/N: {h.serie}</span>
              </td>

              {/* USUARIO */}
              <td>
                {h.empleado_nombre} {h.empleado_apellido}
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
                <button
                  onClick={() => onVerPdfOriginal(h)}
                  className='btn-icon pdf'
                  title='Ver Original'
                >
                  <FaFilePdf />
                </button>
              </td>

              {/* FIRMA (BOTONES CENTRADOS) */}
              <td className='center'>
                <div className='action-buttons-wrapper'>
                  {!h.pdf_firmado_url && (
                    <button
                      onClick={() => onSubirClick(h.id)}
                      className='btn-upload'
                    >
                      <FaUpload /> Subir
                    </button>
                  )}

                  {h.pdf_firmado_url && h.firma_valida !== false && (
                    <div className='signed-actions'>
                      <button
                        onClick={() => onVerFirmado(h.pdf_firmado_url)}
                        className='btn-view'
                        title='Ver Firmado'
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => onInvalidar(h.id)}
                        className='btn-invalid'
                        title='Invalidar'
                      >
                        <FaBan />
                      </button>
                    </div>
                  )}

                  {h.pdf_firmado_url && h.firma_valida === false && (
                    <div className='rejected-wrapper'>
                      <button
                        onClick={() => onSubirClick(h.id)}
                        className='btn-upload re-upload'
                      >
                        <FaUpload /> Re-subir
                      </button>
                    </div>
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
