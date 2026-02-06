import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import { FaUndo, FaHistory } from 'react-icons/fa';
import PdfModal from '../../components/Modal/PdfModal';
import CustomSelect from '../../components/Select/CustomSelect';

import '../Equipos/FormStyles.scss';
import '../Equipos/Equipos.scss';
import logoImg from '../../assets/logo_gruposp.png';
import firmaImg from '../../assets/firma_pierina.png';

const Devolucion = () => {
  const [equiposOcupados, setEquiposOcupados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
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

  const fetchData = async () => {
    try {
      const [resEq, resUs, resHis] = await Promise.all([
        api.get('/equipos'),
        api.get('/usuarios'),
        api.get('/historial'),
      ]);
      setEquiposOcupados(resEq.data.filter((e) => e.disponible === false));
      const usuariosActivos = resUsuarios.data.filter((u) => u.activo === true); // <--- FILTRO IMPORTANTE
      setUsuarios(usuariosActivos);
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
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Opciones Select
  const equiposOptions = equiposOcupados.map((eq) => ({
    value: eq.id,
    label: `${eq.marca} ${eq.modelo} - ${eq.serie}`,
  }));
  const usuariosOptions = usuarios.map((us) => ({
    value: us.id,
    label: `${us.nombres} ${us.apellidos}`,
  }));
  const estadoOptions = [
    { value: 'operativo', label: 'Operativo' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'malogrado', label: 'Malogrado' },
  ];

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
      return toast.warning('Datos incompletos');
    try {
      await api.post('/movimientos/devolucion', {
        ...formData,
        fecha: new Date().toISOString(),
      });
      toast.success('Devolución registrada');
      const eq = equiposOcupados.find((e) => e.id === formData.equipo_id);
      const us = usuarios.find((u) => u.id === formData.empleado_id);
      setPdfUrl(generarPDFBlob(eq, us));
      setShowPdfModal(true);
      fetchData();
      setFormData({
        equipo_id: '',
        empleado_id: '',
        cargador: true,
        observaciones: '',
        estado_final: 'operativo',
      });
    } catch (e) {
      toast.error('Error');
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
        <div
          className='table-container'
          style={{ padding: '2rem' }}
        >
          <form
            className='equipo-form'
            onSubmit={handleSubmit}
          >
            <div className='input-group'>
              <label>Equipo (Ocupado)</label>
              <CustomSelect
                options={equiposOptions}
                value={equiposOptions.find(
                  (o) => o.value === formData.equipo_id,
                )}
                onChange={(o) =>
                  setFormData({ ...formData, equipo_id: o?.value || '' })
                }
                placeholder='Buscar equipo...'
              />
            </div>
            <div
              className='input-group'
              style={{ marginTop: '1rem' }}
            >
              <label>Usuario</label>
              <CustomSelect
                options={usuariosOptions}
                value={usuariosOptions.find(
                  (o) => o.value === formData.empleado_id,
                )}
                onChange={(o) =>
                  setFormData({ ...formData, empleado_id: o?.value || '' })
                }
                placeholder='Buscar usuario...'
              />
            </div>
            <div
              className='input-group'
              style={{ marginTop: '1rem' }}
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
            <div
              className='form-row'
              style={{ marginTop: '1rem' }}
            >
              <div
                className='input-group'
                style={{ flexDirection: 'row', gap: '10px' }}
              >
                <input
                  type='checkbox'
                  name='cargador'
                  checked={formData.cargador}
                  onChange={(e) =>
                    setFormData({ ...formData, cargador: e.target.checked })
                  }
                />
                <label>Devuelve cargador?</label>
              </div>
            </div>
            <button
              type='submit'
              className='btn-submit'
              style={{
                marginTop: '1rem',
                background: '#ef4444',
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <FaUndo /> Registrar Devolución
            </button>
          </form>
        </div>
        <div
          className='table-container'
          style={{ height: 'fit-content' }}
        >
          <h3 style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
            <FaHistory /> Últimas Devoluciones
          </h3>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Equipo</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.fecha_movimiento).toLocaleDateString()}</td>
                  <td>
                    {h.modelo}
                    <br />
                    <small>{h.serie}</small>
                  </td>
                  <td>{h.empleado_nombre}</td>
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
