import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import { FaUndo, FaHistory } from 'react-icons/fa';
import PdfModal from '../../components/Modal/PdfModal'; // <--- IMPORT

import '../Equipos/FormStyles.scss';
import '../Equipos/Equipos.scss';

import logoImg from '../../assets/logo_gruposp.png';
import firmaImg from '../../assets/firma_pierina.png';

const Devolucion = () => {
  const [equiposOcupados, setEquiposOcupados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [historialDevoluciones, setHistorialDevoluciones] = useState([]); // <--- ESTADO TABLA
  const [loading, setLoading] = useState(true);

  // Estados PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const [formData, setFormData] = useState({
    equipo_id: '',
    empleado_id: '',
    cargador: true,
    observaciones: '',
    estado_final: 'operativo',
  });

  const fetchData = async () => {
    try {
      const [resEquipos, resUsuarios, resHistorial] = await Promise.all([
        api.get('/equipos'),
        api.get('/usuarios'),
        api.get('/historial'),
      ]);

      const ocupados = resEquipos.data.filter((e) => e.disponible === false);
      const devoluciones = resHistorial.data
        .filter((h) => h.tipo === 'devolucion')
        .slice(0, 5);

      setEquiposOcupados(ocupados);
      setUsuarios(resUsuarios.data);
      setHistorialDevoluciones(devoluciones);
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

  const handleChange = (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // --- GENERADOR PDF BLOB ---
  const generarPDFBlob = (equipo, usuario) => {
    const doc = new jsPDF();
    const margenIzq = 25;
    const margenDer = 25;
    const anchoPagina = 210;
    const anchoUtil = anchoPagina - margenIzq - margenDer;
    let y = 20;

    doc.addImage(logoImg, 'PNG', margenIzq, 10, 40, 15);
    y += 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const titulo1 =
      'CONSTANCIA DE DEVOLUCIÓN DE DOCUMENTOS Y EQUIPOS DE TRABAJO';
    const titulo2 = '(ANEXO – B)';
    const xT1 = (anchoPagina - doc.getTextWidth(titulo1)) / 2;
    doc.text(titulo1, xT1, y);
    y += 6;
    const xT2 = (anchoPagina - doc.getTextWidth(titulo2)) / 2;
    doc.text(titulo2, xT2, y);
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const fechaActual = new Date().toLocaleDateString();
    doc.text(`Fecha: ${fechaActual}`, margenIzq, y);
    y += 6;
    doc.text('Magdalena', margenIzq, y);
    y += 15;

    const parts = [
      { text: 'Se deja constancia que el Sr./ Srta. ', type: 'normal' },
      { text: `${usuario.nombres} ${usuario.apellidos}`, type: 'bold' },
      {
        text: ' identificado con DNI/Carnet de Extranjería N° ',
        type: 'normal',
      },
      { text: `${usuario.dni}`, type: 'bold' },
      {
        text: ' realiza la devolución de los materiales y/o documentos de trabajo que le fue entregada por EL EMPLEADOR, de acuerdo al siguiente detalle:',
        type: 'normal',
      },
    ];
    let currentX = margenIzq;
    const limitX = margenIzq + anchoUtil;
    const leading = 5;
    parts.forEach((part) => {
      doc.setFont('helvetica', part.type);
      const tokens = part.text.match(/(\S+|\s+)/g) || [];
      tokens.forEach((token) => {
        const tokenWidth = doc.getTextWidth(token);
        if (currentX + tokenWidth > limitX) {
          if (!/^\s+$/.test(token)) {
            currentX = margenIzq;
            y += leading;
          }
        }
        if (currentX === margenIzq && /^\s+$/.test(token)) return;
        doc.text(token, currentX, y);
        currentX += tokenWidth;
      });
    });
    y += 10;

    doc.setFont('helvetica', 'normal');
    const textoEquipo = `- ${equipo.marca} ${equipo.modelo} con Número de serie: ${equipo.serie}`;
    doc.text(textoEquipo, margenIzq + 10, y);
    y += 6;
    const textoCargador = formData.cargador ? '- CARGADOR' : '- SIN CARGADOR';
    doc.text(textoCargador, margenIzq + 10, y);
    y += 15;

    const p1 =
      'Por lo mismo, dejo constancia que EL EMPLEADOR revisará el estado de conservación del equipo debiendo encontrarse en buen estado.';
    const linesP1 = doc.splitTextToSize(p1, anchoUtil);
    doc.text(linesP1, margenIzq, y);
    y += linesP1.length * 5 + 5;

    const p2 =
      'Se firma el presente documento, en señal de conformidad y de conformidad a lo establecido en la cláusula sexta del Convenio de Extinción Laboral y Pago de Beneficios sociales.';
    const linesP2 = doc.splitTextToSize(p2, anchoUtil);
    doc.text(linesP2, margenIzq, y);
    y += linesP2.length * 5 + 15;

    if (y + 50 > 280) {
      doc.addPage();
      y = 20;
    }
    const boxHeight = 50;
    const midPoint = margenIzq + anchoUtil / 2;

    doc.setLineWidth(0.2);
    doc.rect(margenIzq, y, anchoUtil, boxHeight);
    doc.line(midPoint, y, midPoint, y + boxHeight);

    doc.setFont('helvetica', 'bold');
    const textEntrega = 'ENTREGA:';
    const xEntrega =
      margenIzq + (anchoUtil / 2 - doc.getTextWidth(textEntrega)) / 2;
    doc.text(textEntrega, xEntrega, y + 6);

    const textRecibe = 'RECIBE:';
    const xRecibe =
      midPoint + (anchoUtil / 2 - doc.getTextWidth(textRecibe)) / 2;
    doc.text(textRecibe, xRecibe, y + 6);

    const textNombreAdmin = 'Pierina Alarcón';
    const xNombreAdmin =
      midPoint + (anchoUtil / 2 - doc.getTextWidth(textNombreAdmin)) / 2;
    doc.text(textNombreAdmin, xNombreAdmin, y + 15);
    doc.addImage(firmaImg, 'PNG', midPoint + 15, y + 18, 40, 20);
    const textEmpleador = 'EL EMPLEADOR';
    const xEmpleador =
      midPoint + (anchoUtil / 2 - doc.getTextWidth(textEmpleador)) / 2;
    doc.text(textEmpleador, xEmpleador, y + boxHeight - 5);
    doc.line(
      midPoint + 10,
      y + boxHeight - 8,
      margenIzq + anchoUtil - 10,
      y + boxHeight - 8,
    );

    doc.line(
      margenIzq + 10,
      y + boxHeight - 12,
      midPoint - 10,
      y + boxHeight - 12,
    );
    doc.setFontSize(8);
    doc.text(
      `DNI/Carnet de Extranjería N° ${usuario.dni}`,
      margenIzq + 10,
      y + boxHeight - 8,
    );
    doc.setFontSize(10);
    const textTrabajador = 'EL/LA TRABAJADOR/A';
    const xTrabajador =
      margenIzq + (anchoUtil / 2 - doc.getTextWidth(textTrabajador)) / 2;
    doc.text(textTrabajador, xTrabajador, y + boxHeight - 4);

    return doc.output('bloburl');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipo_id || !formData.empleado_id) {
      return toast.warning('Seleccione equipo y usuario');
    }

    try {
      await api.post('/movimientos/devolucion', {
        ...formData,
        fecha: new Date().toISOString(),
      });

      toast.success('Devolución registrada');

      const eq = equiposOcupados.find((e) => e.id == formData.equipo_id);
      const us = usuarios.find((u) => u.id == formData.empleado_id);

      // 1. Generar URL
      const url = generarPDFBlob(eq, us);
      setPdfUrl(url);

      // 2. Mostrar Modal
      setShowPdfModal(true);

      setFormData({
        equipo_id: '',
        empleado_id: '',
        cargador: true,
        observaciones: '',
        estado_final: 'operativo',
      });
      fetchData(); // Recarga y quita equipo de lista
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar devolución');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando datos...</div>;

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
            <div className='form-row'>
              <div className='input-group'>
                <label>Equipo a Devolver (Ocupados)</label>
                <select
                  name='equipo_id'
                  value={formData.equipo_id}
                  onChange={handleChange}
                  required
                  style={{ padding: '12px' }}
                >
                  <option value=''>-- Seleccione --</option>
                  {equiposOcupados.map((eq) => (
                    <option
                      key={eq.id}
                      value={eq.id}
                    >
                      {eq.marca} {eq.modelo} - S/N: {eq.serie}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='form-row'>
              <div className='input-group'>
                <label>Usuario que devuelve</label>
                <select
                  name='empleado_id'
                  value={formData.empleado_id}
                  onChange={handleChange}
                  required
                  style={{ padding: '12px' }}
                >
                  <option value=''>-- Seleccione --</option>
                  {usuarios.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.nombres} {user.apellidos}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='form-row'>
              <div className='input-group'>
                <label>Estado del Equipo (Recepción)</label>
                <select
                  name='estado_final'
                  value={formData.estado_final}
                  onChange={handleChange}
                  style={{ padding: '12px' }}
                >
                  <option value='operativo'>Operativo (Buen Estado)</option>
                  <option value='mantenimiento'>Requiere Mantenimiento</option>
                  <option value='malogrado'>Malogrado / Dañado</option>
                </select>
              </div>
            </div>
            <div className='form-row'>
              <div
                className='input-group'
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <input
                  type='checkbox'
                  name='cargador'
                  checked={formData.cargador}
                  onChange={handleChange}
                  style={{ width: '20px', height: '20px' }}
                />
                <label style={{ margin: 0 }}>¿Devuelve cargador?</label>
              </div>
            </div>
            <div className='input-group'>
              <label>Observaciones</label>
              <textarea
                name='observaciones'
                rows='2'
                value={formData.observaciones}
                onChange={handleChange}
                className='glass-input'
                style={{ background: 'rgba(255,255,255,0.5)', padding: '10px' }}
              />
            </div>
            <button
              type='submit'
              className='btn-submit'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: '#ef4444',
              }}
            >
              <FaUndo /> Guardar y Ver Constancia
            </button>
          </form>
        </div>

        {/* TABLA DEVOLUCIONES */}
        <div
          className='table-container'
          style={{ height: 'fit-content' }}
        >
          <h3
            style={{
              padding: '1rem',
              borderBottom: '1px solid #eee',
              color: '#64748b',
            }}
          >
            <FaHistory style={{ marginRight: '8px' }} /> Últimas Devoluciones
          </h3>
          {historialDevoluciones.length === 0 ? (
            <div className='no-data'>Sin movimientos recientes</div>
          ) : (
            <table style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Equipo</th>
                  <th>Colaborador</th>
                </tr>
              </thead>
              <tbody>
                {historialDevoluciones.map((mov) => (
                  <tr key={mov.id}>
                    <td>
                      {new Date(mov.fecha_movimiento).toLocaleDateString()}
                    </td>
                    <td>
                      {mov.modelo} <br />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {mov.serie}
                      </span>
                    </td>
                    <td>
                      {mov.empleado_nombre} {mov.empleado_apellido}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <PdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        pdfUrl={pdfUrl}
        title='Vista Previa de Devolución'
      />
    </div>
  );
};

export default Devolucion;
