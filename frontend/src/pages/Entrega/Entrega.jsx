import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import { FaPaperPlane, FaHistory, FaCheck, FaTimes } from 'react-icons/fa';
import PdfModal from '../../components/Modal/PdfModal';
import CustomSelect from '../../components/Select/CustomSelect';

// Estilos
import '../Equipos/FormStyles.scss';
import '../Equipos/Equipos.scss';
import logoImg from '../../assets/logo_gruposp.png';
import firmaImg from '../../assets/firma_pierina.png';

const Entrega = () => {
  const [equipos, setEquipos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [historialEntregas, setHistorialEntregas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados PDF Preview
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const [formData, setFormData] = useState({
    equipo_id: '',
    empleado_id: '',
    cargador: true, // Checkbox inicializado en true
    observaciones: '',
  });

  const fetchData = async () => {
    try {
      const [resEquipos, resUsuarios, resHistorial] = await Promise.all([
        api.get('/equipos'),
        api.get('/usuarios'),
        api.get('/historial'),
      ]);

      // 1. Equipos Disponibles
      const disponibles = resEquipos.data.filter(
        (e) => e.estado === 'operativo' && e.disponible === true,
      );
      setEquipos(disponibles);

      // 2. Lógica para filtrar usuarios que YA tienen equipo
      // Calculamos quién tiene equipo basándonos en el historial
      const asignaciones = {}; // Mapa: { id_usuario: cantidad_equipos }

      // Ordenamos historial por fecha (antiguo a nuevo) para procesar cronológicamente
      const historialOrdenado = resHistorial.data.sort(
        (a, b) => new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento),
      );

      historialOrdenado.forEach((mov) => {
        const empId = mov.empleado_id;
        if (mov.tipo === 'entrega') {
          asignaciones[empId] = (asignaciones[empId] || 0) + 1;
        } else if (mov.tipo === 'devolucion') {
          asignaciones[empId] = (asignaciones[empId] || 0) - 1;
          // Evitar negativos por si acaso hay inconsistencias en BD antigua
          if (asignaciones[empId] < 0) asignaciones[empId] = 0;
        }
      });

      // Filtramos: Activos Y que NO tengan equipos asignados (cantidad 0 o undefined)
      const usuariosLibres = resUsuarios.data.filter((u) => {
        const equiposEnPoder = asignaciones[u.id] || 0;
        return u.activo === true && equiposEnPoder === 0;
      });

      setUsuarios(usuariosLibres);

      // 3. Historial Visual (Últimas 10 entregas para la tabla)
      const entregasRecientes = resHistorial.data
        .filter((h) => h.tipo === 'entrega')
        .sort(
          (a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
        )
        .slice(0, 10);
      setHistorialEntregas(entregasRecientes);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const equiposOptions = equipos.map((eq) => ({
    value: eq.id,
    label: `${eq.marca} ${eq.modelo} - S/N: ${eq.serie}`,
  }));

  const usuariosOptions = usuarios.map((usr) => ({
    value: usr.id,
    label: `${usr.nombres} ${usr.apellidos}`,
  }));

  // Manejo del Checkbox simplificado
  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, cargador: e.target.checked });
  };

  // --- REEMPLAZA LA FUNCIÓN formatDateTime POR ESTA ---
  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    const fechaSegura = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const date = new Date(fechaSegura);
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

  const generarPDFBlob = (equipo, usuario) => {
    const doc = new jsPDF();
    const margenIzq = 25;
    const margenDer = 25;
    const anchoPagina = 210;
    const anchoUtil = anchoPagina - margenIzq - margenDer;
    let y = 20;

    doc.addImage(logoImg, 'PNG', margenIzq, 10, 40, 15);
    y += 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const titulo = 'ACTA DE ENTREGA DE EQUIPOS';
    const xTitulo = (anchoPagina - doc.getTextWidth(titulo)) / 2;
    doc.text(titulo, xTitulo, y);
    doc.line(xTitulo, y + 1, xTitulo + doc.getTextWidth(titulo), y + 1);
    y += 15;

    doc.setFontSize(10);
    doc.text('Fecha de entrega:', margenIzq, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString(), margenIzq + 32, y);
    y += 10;

    const prefijo = usuario.genero === 'mujer' ? 'a la Srta.' : 'al Sr.';

    const parts = [
      { text: `En Magdalena, se hace entrega ${prefijo} `, type: 'normal' },
      { text: `${usuario.nombres} ${usuario.apellidos}`, type: 'bold' },
      { text: ' identificado (a) con DNI/PTP/C.E N° ', type: 'normal' },
      { text: `${usuario.dni}`, type: 'bold' },
      { text: ' de los siguientes elementos de trabajo:', type: 'normal' },
    ];

    let currentX = margenIzq;
    parts.forEach((part) => {
      doc.setFont('helvetica', part.type);
      part.text.match(/(\S+|\s+)/g).forEach((token) => {
        if (currentX + doc.getTextWidth(token) > margenIzq + anchoUtil) {
          if (!/^\s+$/.test(token)) {
            currentX = margenIzq;
            y += 5;
          }
        }
        if (!(currentX === margenIzq && /^\s+$/.test(token))) {
          doc.text(token, currentX, y);
          currentX += doc.getTextWidth(token);
        }
      });
    });
    y += 13;

    // Tabla PDF
    const altoFila = 8;
    const altoData = 12;
    const col1 = margenIzq;
    const col2 = margenIzq + 50;
    const col3 = margenIzq + 120;

    doc.setLineWidth(0.1);
    doc.setFont('helvetica', 'bold');
    doc.rect(margenIzq, y, anchoUtil, altoFila);
    doc.line(col2, y, col2, y + altoFila);
    doc.line(col3, y, col3, y + altoFila);
    doc.text('ITEMS', col1 + 2, y + 5);
    doc.text('DESCRIPCIÓN', col2 + 2, y + 5);
    doc.text('CANTIDAD', col3 + 2, y + 5);
    y += altoFila;

    doc.setFont('helvetica', 'normal');
    doc.rect(margenIzq, y, anchoUtil, altoData);
    doc.line(col2, y, col2, y + altoData);
    doc.line(col3, y, col3, y + altoData);

    const descEquipo = `Laptop ${equipo.marca} ${equipo.modelo}`;
    const descCargador = formData.cargador ? ' + Cargador' : ' (Sin Cargador)';

    doc.text(descEquipo + descCargador, col1 + 2, y + 7);
    doc.text(`S/N: ${equipo.serie}`, col2 + 2, y + 7);
    doc.text('1', col3 + 20, y + 7, { align: 'center' });
    y += altoData + 10;

    const legalText = [
      'Por falta de equipos personales para trabajar se hace entrega de esta acta la cual se mantendrá hasta diciembre. Finalizado el plazo el Trabajador deberá devolver el equipo.',
      'Al recibir estos elementos de trabajo, me comprometo a:',
      '• Utilizar el equipo para los fines correspondientes a su labor.',
      '• Por lo mismo, me hago responsable en caso de pérdida o robo.',
      '• Comunicar inmediatamente a mi empleador si hubiera algún inconveniente.',
      '• Debo recoger y devolver el equipo al iniciar y terminar mi relación laboral.',
      '• Toda devolución del equipo debe ser en oficina por cuenta propia.',
    ];
    legalText.forEach((txt) => {
      const lines = doc.splitTextToSize(txt, anchoUtil);
      doc.text(lines, margenIzq, y);
      y += lines.length * 5 + 2;
    });

    const yFirma = 250;
    doc.line(margenIzq, yFirma, margenIzq + 60, yFirma);
    doc.setFont('helvetica', 'bold');
    doc.text(`DNI: ${usuario.dni}`, margenIzq, yFirma + 5);
    doc.text('EL/LA TRABAJADOR/A', margenIzq, yFirma + 10);

    const xDer = 120;
    doc.addImage(firmaImg, 'PNG', xDer + 10, yFirma - 25, 40, 20);
    doc.line(xDer, yFirma, xDer + 60, yFirma);
    doc.text('PIERINA ALARCON DILLERVA', xDer, yFirma + 5);
    doc.text('GTH', xDer + 20, yFirma + 10);

    return doc.output('bloburl');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipo_id || !formData.empleado_id)
      return toast.warning('Seleccione equipo y usuario');

    try {
      await api.post('/movimientos/entrega', {
        ...formData,
        fecha: new Date().toISOString(),
      });
      toast.success('Entrega registrada');

      const eq = equipos.find((e) => e.id === formData.equipo_id);
      const us = usuarios.find((u) => u.id === formData.empleado_id);

      setPdfUrl(generarPDFBlob(eq, us));
      setShowPdfModal(true);
      // Reiniciar formulario
      setFormData({
        equipo_id: '',
        empleado_id: '',
        cargador: true,
        observaciones: '',
      });
      fetchData(); // Recargar datos para actualizar listas
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar');
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className='equipos-container'>
      <div className='page-header'>
        <h1>Registrar Entrega</h1>
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
            <div className='input-group'>
              <label>Equipo (Disponibles)</label>
              <CustomSelect
                options={equiposOptions}
                value={equiposOptions.find(
                  (op) => op.value === formData.equipo_id,
                )}
                onChange={(op) =>
                  setFormData({ ...formData, equipo_id: op?.value || '' })
                }
                placeholder='Buscar equipo...'
              />
            </div>

            <div
              className='input-group'
              style={{ marginTop: '1rem' }}
            >
              <label>Colaborador (Sin equipo asignado)</label>
              <CustomSelect
                options={usuariosOptions}
                value={usuariosOptions.find(
                  (op) => op.value === formData.empleado_id,
                )}
                onChange={(op) =>
                  setFormData({ ...formData, empleado_id: op?.value || '' })
                }
                placeholder='Buscar colaborador...'
              />
            </div>

            {/* CHECKBOX ARREGLADO */}
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
                  cursor: 'pointer', // Cursor de mano en todo el bloque
                }}
              >
                <input
                  type='checkbox'
                  name='cargador'
                  checked={formData.cargador}
                  onChange={handleCheckboxChange}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#7c3aed', // Color morado del tema
                  }}
                />
                <span
                  style={{
                    fontWeight: '600',
                    color: '#334155',
                    fontSize: '0.95rem',
                  }}
                >
                  ¿Incluye Cargador?
                </span>
              </label>
            </div>

            <button
              type='submit'
              className='btn-submit'
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <FaPaperPlane /> Guardar y Ver Acta
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
            <FaHistory style={{ marginRight: '8px' }} /> Últimas Entregas
          </h3>
          <table>
            <thead>
              <tr>
                <th>Fecha y Hora Entrega</th>
                <th>Equipo</th>
                <th>Colaborador</th>
                <th style={{ textAlign: 'center' }}>Cargador</th>
              </tr>
            </thead>
            <tbody>
              {historialEntregas.map((h) => (
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

                  {/* CHECKBOX VISUAL */}
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
        title='Vista Previa Acta'
      />
    </div>
  );
};

export default Entrega;
