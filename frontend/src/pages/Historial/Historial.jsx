import { useEffect, useState } from 'react';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import {
  FaFileExcel,
  FaSearch,
  FaUserShield,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaLaptop,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Historial.scss';

const Historial = () => {
  const [historial, setHistorial] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState({
    value: 'todos',
    label: 'Todos los movimientos',
  });
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const typeOptions = [
    { value: 'todos', label: 'Todos los movimientos' },
    { value: 'entrega', label: 'Entregas' },
    { value: 'devolucion', label: 'Devoluciones' },
  ];

  // Estilos personalizados para React Select para que empate con el buscador
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      height: '46px',
      minHeight: '46px',
      borderRadius: '12px',
      border: state.isFocused ? '1px solid #4f46e5' : '1px solid #e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : 'none',
      fontSize: '0.95rem',
      '&:hover': { borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1' },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#4f46e5'
        : state.isFocused
          ? '#f1f5f9'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      fontSize: '0.9rem',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#334155',
      fontWeight: '500',
    }),
  };

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await api.get('/historial');
        setHistorial(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Error cargando el historial');
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroTexto, filtroTipo]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (intervalObj) => {
    if (!intervalObj) return '-';
    let texto = [];
    if (intervalObj.years) texto.push(`${intervalObj.years} años`);
    if (intervalObj.months) texto.push(`${intervalObj.months} meses`);
    if (intervalObj.days) texto.push(`${intervalObj.days} días`);
    if (texto.length === 0) return 'Reciente';
    return texto.join(', ');
  };

  const exportarExcel = () => {
    const dataParaExcel = historial.map((h) => ({
      Fecha: formatDateTime(h.fecha_movimiento),
      Tipo: h.tipo.toUpperCase(),
      Marca: h.marca,
      Modelo: h.modelo,
      Serie: h.serie,
      Empleado: `${h.empleado_nombre} ${h.empleado_apellido}`,
      DNI: h.dni || '-',
      'Empresa Colaborador': h.empleado_empresa || h.empresa_empleado || '-',
      Responsable: h.admin_nombre ? h.admin_nombre : 'Sistema',
      'Empresa Responsable': h.admin_empresa || h.empresa_admin || 'Sistema',
      'Correo Responsable': h.admin_correo || '-',
      'Tiempo de Uso':
        h.tipo === 'entrega' ? formatDuration(h.tiempo_uso) : '-',
      'Estado Final': h.estado_equipo_momento || '-',
      Observaciones: h.observaciones || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    XLSX.writeFile(wb, 'Reporte_Historial_GTH.xlsx');
  };

  const historialFiltrado = historial.filter((h) => {
    const coincideTexto =
      h.empleado_nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      h.serie?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      h.modelo?.toLowerCase().includes(filtroTexto.toLowerCase());
    const coincideTipo =
      filtroTipo.value === 'todos' || h.tipo.toLowerCase() === filtroTipo.value;
    return coincideTexto && coincideTipo;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historialFiltrado.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(historialFiltrado.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading)
    return <div className='loading-state'>Cargando Historial...</div>;

  return (
    <div className='historial-container'>
      <div className='page-header'>
        <h1>Historial y Auditoría</h1>
        <div className='header-actions'>
          <button
            onClick={exportarExcel}
            className='btn-action-header btn-excel'
          >
            <FaFileExcel /> Exportar Excel
          </button>
        </div>
      </div>

      {/* --- CONTENEDOR DE FILTROS ARREGLADO --- */}
      <div className='filters-container'>
        <div className='search-bar'>
          <FaSearch color='#94a3b8' />
          <input
            type='text'
            placeholder='Buscar por empleado, serie o modelo...'
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        <div className='select-filter'>
          <Select
            options={typeOptions}
            value={filtroTipo}
            onChange={setFiltroTipo}
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>
      </div>

      {/* --- TABLA CON ESTILOS UNIFICADOS --- */}
      <div className='table-container'>
        {currentItems.length === 0 ? (
          <div className='no-data'>
            No se encontraron registros que coincidan.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th className='center'>Tipo</th>
                <th>Equipo</th>
                <th>Empleado</th>
                <th>Auditoría</th>
                <th>Tiempo de Uso</th>
                <th className='center'>Estado</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((h) => (
                <tr key={h.id}>
                  <td>
                    <div className='email-cell'>
                      <FaClock /> {formatDateTime(h.fecha_movimiento)}
                    </div>
                  </td>
                  <td className='center'>
                    <span className={`status-badge ${h.tipo}`}>
                      {h.tipo === 'entrega' ? (
                        <FaArrowUp style={{ marginRight: '4px' }} />
                      ) : (
                        <FaArrowDown style={{ marginRight: '4px' }} />
                      )}
                      {h.tipo.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span
                        className='name'
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <FaLaptop style={{ color: '#94a3b8' }} /> {h.marca}{' '}
                        {h.modelo}
                      </span>
                      <span
                        className='audit-text'
                        style={{ fontFamily: 'monospace' }}
                      >
                        S/N: {h.serie}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span
                        className='name'
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <FaUser style={{ color: '#94a3b8' }} />{' '}
                        {h.empleado_nombre} {h.empleado_apellido}
                      </span>
                      {h.dni && (
                        <span className='audit-text'>DNI: {h.dni}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className='audit-cell'>
                      {h.admin_nombre ? (
                        <div className='user-info'>
                          <span
                            className='name'
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <FaUserShield style={{ color: '#4f46e5' }} />{' '}
                            {h.admin_nombre}
                          </span>
                          <span className='audit-text'>{h.admin_correo}</span>
                        </div>
                      ) : (
                        <span className='system-text'>Sistema</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {h.tipo === 'entrega' ? (
                      <div className='info-cell'>
                        <span
                          className='name'
                          style={{ color: '#059669', fontSize: '0.85rem' }}
                        >
                          {formatDuration(h.tiempo_uso)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                    )}
                  </td>
                  <td className='center'>
                    {h.tipo === 'devolucion' && h.estado_equipo_momento ? (
                      <span
                        className={`status-badge ${h.estado_equipo_momento === 'operativo' ? 'operativo' : 'malogrado'}`}
                      >
                        {h.estado_equipo_momento}
                      </span>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* --- PAGINACIÓN --- */}
        {historialFiltrado.length > 0 && (
          <div className='pagination-footer'>
            <div className='info'>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
              <strong>
                {Math.min(indexOfLastItem, historialFiltrado.length)}
              </strong>{' '}
              de <strong>{historialFiltrado.length}</strong>
            </div>
            <div className='controls'>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <FaChevronLeft size={12} />
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const pageNumber = i + 1;
                const isActive = currentPage === pageNumber;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={isActive ? 'active' : ''}
                    disabled={isActive}
                    style={isActive ? { opacity: 1, cursor: 'default' } : {}}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;
