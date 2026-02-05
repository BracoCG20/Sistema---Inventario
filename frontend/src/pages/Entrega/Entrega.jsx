import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import { FaPaperPlane } from 'react-icons/fa';

// ESTILOS
import '../Equipos/FormStyles.scss';
import '../Equipos/Equipos.scss';

// IMÁGENES (Asegúrate de tenerlas en src/assets/)
import logoImg from '../../assets/logo_gruposp.png';
import firmaImg from '../../assets/firma_pierina.png';

const Entrega = () => {
  const [equipos, setEquipos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    equipo_id: '',
    empleado_id: '',
    cargador: true,
    observaciones: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resEquipos, resUsuarios] = await Promise.all([
          api.get('/equipos'),
          api.get('/usuarios'),
        ]);

        const disponibles = resEquipos.data.filter(
          (e) => e.estado === 'operativo' && e.disponible === true,
        );

        setEquipos(disponibles);
        setUsuarios(resUsuarios.data);
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // --- GENERADOR PDF RÉPLICA EXACTA ---
  const generarPDF = (equipo, usuario) => {
    const doc = new jsPDF();

    // CONFIGURACIÓN DE MÁRGENES Y FUENTE
    const margenIzq = 25; // 2.5cm aprox, estándar Word
    const margenDer = 25;
    const anchoPagina = 210; // A4 width en mm
    const anchoUtil = anchoPagina - margenIzq - margenDer; // 160mm para escribir

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = 20; // Posición vertical inicial

    // 1. LOGO
    doc.addImage(logoImg, 'PNG', margenIzq, 10, 40, 15);

    y += 20;

    // 2. TÍTULO
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const titulo = 'ACTA DE ENTREGA DE EQUIPOS';
    const anchoTexto = doc.getTextWidth(titulo);
    const xTitulo = (anchoPagina - anchoTexto) / 2;

    doc.text(titulo, xTitulo, y);
    doc.line(xTitulo, y + 1, xTitulo + anchoTexto, y + 1);

    y += 15;

    // 3. DATOS DE CABECERA
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de entrega:', margenIzq, y);
    doc.setFont('helvetica', 'normal');
    const fechaActual = new Date().toLocaleDateString();
    doc.text(fechaActual, margenIzq + 32, y);

    y += 10;

    // ---------------------------------------------------------
    // 4. PÁRRAFO INTRODUCTORIO (CON NEGRILLAS DINÁMICAS)
    // ---------------------------------------------------------
    // Definimos las partes del texto y su estilo
    const parts = [
      {
        text: 'En Magdalena, se hace entrega al(la) señor(a) ',
        type: 'normal',
      },
      { text: `${usuario.nombres} ${usuario.apellidos}`, type: 'bold' },
      { text: ' identificado (a) con DNI/PTP/C.E N° ', type: 'normal' },
      { text: `${usuario.dni}`, type: 'bold' },
      { text: ' de los siguientes elementos de trabajo:', type: 'normal' },
    ];

    let currentX = margenIzq;
    const limitX = margenIzq + anchoUtil;
    const leading = 5; // Altura de línea

    parts.forEach((part) => {
      doc.setFont('helvetica', part.type);

      // Dividimos el texto en palabras/espacios para controlar el salto de línea
      // Regex: captura cualquier secuencia de NO-espacios O cualquier secuencia de espacios
      const tokens = part.text.match(/(\S+|\s+)/g) || [];

      tokens.forEach((token) => {
        const tokenWidth = doc.getTextWidth(token);

        // Si la palabra excede el ancho útil, saltamos de línea
        if (currentX + tokenWidth > limitX) {
          // Si es solo un espacio el que sobra, no hacemos salto forzado, solo lo ignoramos visualmente
          if (!/^\s+$/.test(token)) {
            currentX = margenIzq;
            y += leading;
          }
        }

        // Si estamos al inicio de una nueva línea y el token es un espacio, lo saltamos para no tener indentación rara
        if (currentX === margenIzq && /^\s+$/.test(token)) {
          return;
        }

        doc.text(token, currentX, y);
        currentX += tokenWidth;
      });
    });

    y += leading + 8; // Espacio extra después del párrafo
    // ---------------------------------------------------------

    // 5. TABLA
    const altoFila = 8;
    const altoFilaDatos = 12;
    const col1W = 50;
    const col2W = 70;
    const col3W = 40;
    const xCol1 = margenIzq;
    const xCol2 = margenIzq + col1W;
    const xCol3 = margenIzq + col1W + col2W;

    // -- Cabecera Tabla --
    doc.setLineWidth(0.1);
    doc.setFont('helvetica', 'bold');
    doc.rect(margenIzq, y, anchoUtil, altoFila);
    doc.line(xCol2, y, xCol2, y + altoFila);
    doc.line(xCol3, y, xCol3, y + altoFila);
    doc.text('ITEMS', xCol1 + 2, y + 5);
    doc.text('DESCRIPCIÓN', xCol2 + 2, y + 5);
    doc.text('CANTIDAD', xCol3 + 2, y + 5);

    y += altoFila;

    // -- Datos Tabla --
    doc.setFont('helvetica', 'normal');
    doc.rect(margenIzq, y, anchoUtil, altoFilaDatos);
    doc.line(xCol2, y, xCol2, y + altoFilaDatos);
    doc.line(xCol3, y, xCol3, y + altoFilaDatos);
    doc.text('Laptop y cargador', xCol1 + 2, y + 7);
    doc.text(`código de equipo: ${equipo.serie}`, xCol2 + 2, y + 7);
    doc.text('1', xCol3 + col3W / 2, y + 7, { align: 'center' });

    y += altoFilaDatos + 10;

    // 6. CLÁUSULAS
    const parrafo1 =
      'Por falta de equipos personales para trabajar se hace entrega de esta acta la cual se mantendrá hasta diciembre. Finalizado el plazo el Trabajador deberá devolver el equipo. En cualquier escenario se obliga a devolver estos equipos a solo el requerimiento del empleador o al término del periodo de trabajo.';
    const lineasP1 = doc.splitTextToSize(parrafo1, anchoUtil);
    doc.text(lineasP1, margenIzq, y);

    y += lineasP1.length * 4 + 5;

    doc.setFont('helvetica', 'bold');
    doc.text(
      'Al recibir estos elementos de trabajo, me comprometo a:',
      margenIzq,
      y,
    );
    y += 6;

    doc.setFont('helvetica', 'normal');

    const compromisos = [
      'Utilizar el equipo para los fines correspondientes a su labor; como también de cuidarla y mantenerla en buenas condiciones.',
      'Por lo mismo, me hago responsable en caso de pérdida o robo o cualquier otro daño que pueda sufrir el equipo durante mi periodo de trabajo.',
      'Comunicar inmediatamente a mi empleador si hubiera algún inconveniente con el equipo o si hubiera sufrido algún daño.',
      'Debo recoger y devolver el equipo al iniciar y terminar mi relación laboral; bajo previa coordinación con mi empleador.',
      'Toda devolución del equipo debe ser en oficina por cuenta propia del usuario y bajo coordinación del encargado de TI.',
    ];

    compromisos.forEach((item) => {
      doc.text('•', margenIzq + 5, y);
      const lineasItem = doc.splitTextToSize(item, anchoUtil - 10);
      doc.text(lineasItem, margenIzq + 10, y);
      y += lineasItem.length * 4 + 2;
    });

    y += 3;
    const parrafoFinal =
      'El Empleador realizará la entrega del equipo mostrando el estado correcto de la misma y de acuerdo a esto se firma esta acta de entrega.';
    const lineasPF = doc.splitTextToSize(parrafoFinal, anchoUtil);
    doc.text(lineasPF, margenIzq, y);

    // 7. FIRMAS
    const yFirmas = y + 35 > 250 ? 250 : y + 35;

    // -- Firma Izquierda --
    doc.line(margenIzq, yFirmas, margenIzq + 65, yFirmas);
    doc.setFont('helvetica', 'bold');
    doc.text(`DNI/PTP/C.E N° ${usuario.dni}`, margenIzq, yFirmas + 5);
    doc.text('EL/LA TRABAJADOR/A', margenIzq + 8, yFirmas + 10);

    // -- Firma Derecha --
    const xDer = 120;
    doc.addImage(firmaImg, 'PNG', xDer + 10, yFirmas - 25, 40, 20);
    doc.line(xDer, yFirmas, xDer + 65, yFirmas);
    doc.text('PIERINA ALARCON DILLERVA', xDer, yFirmas + 5);
    doc.text('GTH', xDer + 25, yFirmas + 10);

    doc.save(`Acta_${equipo.serie}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.equipo_id || !formData.empleado_id) {
      return toast.warning('Seleccione equipo y usuario');
    }

    try {
      await api.post('/movimientos/entrega', {
        ...formData,
        fecha: new Date().toISOString(),
      });

      toast.success('Entrega registrada');

      const equipoSelect = equipos.find((e) => e.id == formData.equipo_id);
      const userSelect = usuarios.find((u) => u.id == formData.empleado_id);

      generarPDF(equipoSelect, userSelect);

      setFormData({
        equipo_id: '',
        empleado_id: '',
        cargador: true,
        observaciones: '',
      });
      setEquipos((prev) => prev.filter((e) => e.id != formData.equipo_id));
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar entrega');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando datos...</div>;

  return (
    <div className='equipos-container'>
      <div className='page-header'>
        <h1>Registrar Entrega</h1>
      </div>

      <div
        className='table-container'
        style={{ padding: '2rem', maxWidth: '800px' }}
      >
        <form
          className='equipo-form'
          onSubmit={handleSubmit}
        >
          <div className='form-row'>
            <div className='input-group'>
              <label>Seleccionar Equipo</label>
              <select
                name='equipo_id'
                value={formData.equipo_id}
                onChange={handleChange}
                required
                style={{ padding: '12px' }}
              >
                <option value=''>-- Seleccione --</option>
                {equipos.map((eq) => (
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
              <label>Colaborador</label>
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
              <label style={{ margin: 0 }}>¿Incluye cargador?</label>
            </div>
          </div>

          <button
            type='submit'
            className='btn-submit'
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <FaPaperPlane /> Generar Acta
          </button>
        </form>
      </div>
    </div>
  );
};

export default Entrega;
