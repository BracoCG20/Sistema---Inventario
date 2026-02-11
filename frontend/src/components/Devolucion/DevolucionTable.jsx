import React from 'react';
import {
  FaHistory,
  FaCheck,
  FaTimes,
  FaFilePdf,
  FaCircle,
  FaUpload,
  FaEye,
  FaBan,
  FaEnvelope,
  FaExclamationTriangle,
  FaCalendarAlt, // <-- Agregado para el diseño de fecha
} from 'react-icons/fa';

const DevolucionTable = ({
  historial,
  onVerPdf,
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

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'operativo':
        return {
          color: '#16a34a',
          bg: '#dcfce7',
          text: 'Operativo',
          icon: FaCheck,
        };
      case 'malogrado':
        return {
          color: '#ea580c',
          bg: '#ffedd5',
          text: 'Malogrado',
          icon: FaTimes,
        };
      case 'robado':
        return {
          color: '#dc2626',
          bg: '#fee2e2',
          text: 'Robado',
          icon: FaTimes,
        };
      default:
        return {
          color: '#64748b',
          bg: '#f1f5f9',
          text: 'INACTIVO',
          icon: FaCircle,
        };
    }
  };

  return (
    <div className='table-container'>
      <div className='table-header-title'>
        <h3>
          <FaHistory /> Últimas Devoluciones
        </h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Equipo Devuelto</th>
            <th>Usuario</th>
            <th className='center'>Estado</th>
            <th className='center'>Carg.</th>
            <th className='center'>Correo</th>
            <th className='center'>Acta</th>
            <th className='center'>Firma</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((h) => {
            const status = getStatusBadge(h.estado_equipo_momento);
            const StatusIcon = status.icon;

            return (
              <tr key={h.id}>
                {/* FECHA Y HORA */}
                <td>
                  <div className='email-cell'>
                    <FaCalendarAlt /> {formatDateTime(h.fecha_movimiento)}
                  </div>
                </td>

                {/* EQUIPO DEVUELTO */}
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

                {/* ESTADO FINAL DEL EQUIPO */}
                <td className='center'>
                  <div
                    className='status-badge'
                    style={{
                      background: status.bg,
                      color: status.color,
                      borderColor: status.bg,
                    }}
                  >
                    <StatusIcon style={{ marginRight: '4px' }} /> {status.text}
                  </div>
                </td>

                {/* CARGADOR DEVUELTO */}
                <td className='center'>
                  {h.cargador ? (
                    <FaCheck className='check-icon' />
                  ) : (
                    <FaTimes className='mail-error' />
                  )}
                </td>

                {/* ESTADO DEL CORREO */}
                <td className='center'>
                  {h.correo_enviado === true && (
                    <FaEnvelope
                      className='mail-success'
                      title='Correo enviado'
                    />
                  )}
                  {h.correo_enviado === false && (
                    <FaExclamationTriangle
                      className='mail-error'
                      title='Error envío'
                    />
                  )}
                  {h.correo_enviado === null && (
                    <span style={{ color: '#cbd5e1' }}>-</span>
                  )}
                </td>

                {/* PDF GENERADO (VER CONSTANCIA) */}
                <td className='center'>
                  <div className='actions-cell'>
                    <button
                      onClick={() => onVerPdf(h)}
                      className='action-btn pdf-btn'
                      title='Ver Constancia'
                    >
                      <FaFilePdf />
                    </button>
                  </div>
                </td>

                {/* PDF FIRMADO (ACCIONES) */}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DevolucionTable;
