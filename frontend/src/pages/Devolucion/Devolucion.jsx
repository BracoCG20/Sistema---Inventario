import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import {
  FaUndo,
  FaHistory,
  FaCheck,
  FaTimes,
  FaLaptop,
  FaUserCheck,
} from 'react-icons/fa';
import PdfModal from '../../components/Modal/PdfModal';
import CustomSelect from '../../components/Select/CustomSelect';

import '../Equipos/FormStyles.scss';
import '../Equipos/Equipos.scss';
import logoImg from '../../assets/logo_gruposp.png';
import firmaImg from '../../assets/firma_pierina.png';

const Devolucion = () => {
  // Datos crudos
  const [allEquipos, setAllEquipos] = useState([]);
  const [allUsuarios, setAllUsuarios] = useState([]);

  // Datos procesados para el formulario
  const [usuariosConEquipo, setUsuariosConEquipo] = useState([]);
  const [mapaAsignaciones, setMapaAsignaciones] = useState({}); // { usuarioId: equipoObjeto }

  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const [formData, setFormData] = useState({
    equipo_id: '',
    empleado_id: '',
    cargador: true,
    observaciones: '',
    estado_final: 'operativo',
  });

  const [equipoDetectado, setEquipoDetectado] = useState(null); // Para mostrar en UI

  const fetchData = async () => {
    try {
      const [resEq, resUs, resHis] = await Promise.all([
        api.get('/equipos'),
        api.get('/usuarios'),
        api.get('/historial'),
      ]);

      setAllEquipos(resEq.data);
      setAllUsuarios(resUs.data);

      // --- LÓGICA CORE: ¿QUIÉN TIENE QUÉ? ---
      // 1. Ordenar historial cronológicamente (Antiguo -> Nuevo)
      const sortedHistory = resHis.data.sort(
        (a, b) => new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento),
      );

      // 2. Reconstruir el estado actual
      // Mapa: { empleado_id: equipo_id }
      const asignacionesTemp = {};

      sortedHistory.forEach((mov) => {
        if (mov.tipo === 'entrega') {
          asignacionesTemp[mov.empleado_id] = mov.equipo_id;
        } else if (mov.tipo === 'devolucion') {
          // Si devuelve, borramos la asignación
          // (Validamos que sea el mismo equipo por seguridad)
          if (asignacionesTemp[mov.empleado_id] === mov.equipo_id) {
            delete asignacionesTemp[mov.empleado_id];
          }
        }
      });

      // 3. Crear lista de usuarios filtrada y mapa de objetos
      const usuariosList = [];
      const mapaCompleto = {};

      Object.keys(asignacionesTemp).forEach((userId) => {
        const uId = parseInt(userId);
        const eqId = asignacionesTemp[userId];

        const usuario = resUs.data.find((u) => u.id === uId);
        const equipo = resEq.data.find((e) => e.id === eqId);

        if (usuario && equipo && usuario.activo) {
          usuariosList.push(usuario);
          mapaCompleto[uId] = equipo;
        }
      });

      setUsuariosConEquipo(usuariosList);
      setMapaAsignaciones(mapaCompleto);

      // 4. Historial Visual
      setHistorial(
        resHis.data
          .filter((h) => h.tipo === 'devolucion')
          .sort(
            (a, b) =>
              new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
          )
          .slice(0, 10),
      );
    } catch (e) {
      console.error(e);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- MANEJADORES ---

  // Cuando selecciona Usuario -> Automáticamente seleccionamos el Equipo
  const handleUserChange = (selectedOption) => {
    const userId = selectedOption?.value;

    if (userId) {
      const equipoAsignado = mapaAsignaciones[userId];
      setEquipoDetectado(equipoAsignado);

      setFormData({
        ...formData,
        empleado_id: userId,
        equipo_id: equipoAsignado.id, // Auto-llenado
      });
    } else {
      setEquipoDetectado(null);
      setFormData({ ...formData, empleado_id: '', equipo_id: '' });
    }
  };

  // Opciones Select (Solo usuarios que tienen algo que devolver)
  const usuariosOptions = usuariosConEquipo.map((us) => ({
    value: us.id,
    label: `${us.nombres} ${us.apellidos}`,
  }));

  const estadoOptions = [
    { value: 'operativo', label: 'Operativo' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'malogrado', label: 'Malogrado' },
  ];

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';

    // 1. Aseguramos que la fecha se interprete como UTC agregando 'Z' si falta
    // Esto obliga al navegador a restar las 5 horas de Perú.
    const fechaSegura = isoString.endsWith('Z') ? isoString : `${isoString}Z`;

    const date = new Date(fechaSegura);

    return date.toLocaleString('es-PE', {
      timeZone: 'America/Lima', // Forzamos la zona horaria de Perú
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const generarPDFBlob = (equipo, usuario) => {
    const doc = new jsPDF();
    const margen = 25;
    const ancho = 210;
    const util = ancho - 50;
    let y = 20;

    doc.addImage(logoImg, 'PNG', margen, 10, 40, 15);
    y += 25;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);

    const t1 = 'CONSTANCIA DE DEVOLUCIÓN (ANEXO B)';
    doc.text(t1, (ancho - doc.getTextWidth(t1)) / 2, y);
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margen, y);
    y += 6;
    doc.text('Magdalena', margen, y);
    y += 15;

    const prefijo = usuario.genero === 'mujer' ? 'la Srta.' : 'el Sr.';

    // Cuerpo
    const texto = `Se deja constancia que ${prefijo} ${usuario.nombres} ${usuario.apellidos} identificado con DNI ${usuario.dni} realiza la devolución de:`;
    doc.text(doc.splitTextToSize(texto, util), margen, y);
    y += 15;

    doc.text(
      `- ${equipo.marca} ${equipo.modelo} Serie: ${equipo.serie}`,
      margen + 5,
      y,
    );
    y += 6;
    doc.text(
      formData.cargador ? '- CON CARGADOR' : '- SIN CARGADOR',
      margen + 5,
      y,
    );
    y += 15;

    const legal =
      'El EMPLEADOR revisará el estado del equipo. Se firma en señal de conformidad.';
    doc.text(doc.splitTextToSize(legal, util), margen, y);
    y += 30;

    // Caja Firmas
    const hBox = 40;
    const mid = margen + util / 2;
    doc.rect(margen, y, util, hBox);
    doc.line(mid, y, mid, y + hBox);

    doc.setFont('helvetica', 'bold');
    doc.text('ENTREGA (Trabajador)', margen + 5, y + 5);
    doc.text('RECIBE (Empleador)', mid + 5, y + 5);

    doc.setFontSize(9);
    doc.text(`${usuario.nombres}`, margen + 5, y + 35);

    doc.addImage(firmaImg, 'PNG', mid + 10, y + 10, 30, 15);
    doc.text('Pierina Alarcón', mid + 5, y + 35);

    return doc.output('bloburl');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipo_id || !formData.empleado_id)
      return toast.warning('Seleccione un usuario con equipo asignado');

    try {
      await api.post('/movimientos/devolucion', {
        ...formData,
        fecha: new Date().toISOString(),
      });
      toast.success('Devolución registrada correctamente');

      const us = allUsuarios.find((u) => u.id === formData.empleado_id);
      const eq = allEquipos.find((e) => e.id === formData.equipo_id);

      setPdfUrl(generarPDFBlob(eq, us));
      setShowPdfModal(true);

      // Limpiar y recargar
      setFormData({
        equipo_id: '',
        empleado_id: '',
        cargador: true,
        observaciones: '',
        estado_final: 'operativo',
      });
      setEquipoDetectado(null);
      fetchData(); // Actualiza las listas (el usuario desaparecerá del select)
    } catch (e) {
      console.error(e);
      toast.error('Error al registrar devolución');
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className='equipos-container'>
      <div className='page-header'>
        <h1>Registrar Devolución</h1>
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}
      >
        {/* FORMULARIO */}
        <div
          className='table-container'
          style={{ padding: '2rem' }}
        >
          <form
            className='equipo-form'
            onSubmit={handleSubmit}
          >
            {/* 1. SELECCIÓN DE USUARIO (SOLO LOS QUE DEBEN) */}
            <div className='input-group'>
              <label>Usuario (Con equipo pendiente)</label>
              <CustomSelect
                options={usuariosOptions}
                value={usuariosOptions.find(
                  (o) => o.value === formData.empleado_id,
                )}
                onChange={handleUserChange}
                placeholder='Buscar usuario...'
              />
            </div>

            {/* 2. EQUIPO DETECTADO (VISUALIZACIÓN) */}
            {equipoDetectado && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '15px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    background: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    fontSize: '1.5rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  }}
                >
                  <FaLaptop />
                </div>
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: '#64748b',
                      fontWeight: '600',
                    }}
                  >
                    EQUIPO A DEVOLVER
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>
                    {equipoDetectado.marca} {equipoDetectado.modelo}
                  </strong>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#334155',
                      fontFamily: 'monospace',
                    }}
                  >
                    S/N: {equipoDetectado.serie}
                  </div>
                </div>
              </div>
            )}

            {!equipoDetectado && formData.empleado_id === '' && (
              <div
                style={{
                  marginTop: '1rem',
                  color: '#94a3b8',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                }}
              >
                Seleccione un usuario para ver el equipo asignado.
              </div>
            )}

            <div
              className='input-group'
              style={{ marginTop: '1.5rem' }}
            >
              <label>Estado Recepción</label>
              <CustomSelect
                options={estadoOptions}
                value={estadoOptions.find(
                  (o) => o.value === formData.estado_final,
                )}
                onChange={(o) =>
                  setFormData({ ...formData, estado_final: o?.value || '' })
                }
              />
            </div>

            {/* CHECKBOX */}
            <div
              className='form-row'
              style={{ marginTop: '1.5rem' }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                <input
                  type='checkbox'
                  checked={formData.cargador}
                  onChange={(e) =>
                    setFormData({ ...formData, cargador: e.target.checked })
                  }
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#ef4444',
                  }}
                />
                <span style={{ fontWeight: '600', color: '#334155' }}>
                  ¿Devuelve con cargador?
                </span>
              </label>
            </div>

            <button
              type='submit'
              className='btn-submit'
              disabled={!equipoDetectado} // Deshabilitar si no hay equipo detectado
              style={{
                marginTop: '1.5rem',
                background: !equipoDetectado ? '#cbd5e1' : '#ef4444',
                cursor: !equipoDetectado ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <FaUndo /> Registrar Devolución
            </button>
          </form>
        </div>

        {/* HISTORIAL */}
        <div
          className='table-container'
          style={{ height: 'fit-content' }}
        >
          <h3
            style={{
              padding: '1rem',
              borderBottom: '1px solid #eee',
              fontSize: '1.1rem',
              color: '#1e293b',
            }}
          >
            <FaHistory style={{ marginRight: '8px' }} /> Últimas Devoluciones
          </h3>
          <table>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Equipo</th>
                <th>Usuario</th>
                <th style={{ textAlign: 'center' }}>Cargador</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.id}>
                  <td>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#475569',
                      }}
                    >
                      {formatDateTime(h.fecha_movimiento)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600' }}>{h.modelo}</span>
                    <br />
                    <small
                      style={{ fontFamily: 'monospace', color: '#64748b' }}
                    >
                      S/N: {h.serie}
                    </small>
                  </td>
                  <td>
                    {h.empleado_nombre} {h.empleado_apellido}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        background:
                          h.cargador !== false ? '#dcfce7' : '#fee2e2',
                        color: h.cargador !== false ? '#16a34a' : '#ef4444',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                      }}
                    >
                      {h.cargador !== false ? (
                        <FaCheck style={{ fontSize: '0.8rem' }} />
                      ) : (
                        <FaTimes style={{ fontSize: '0.8rem' }} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        pdfUrl={pdfUrl}
        title='Constancia Devolución'
      />
    </div>
  );
};

export default Devolucion;
