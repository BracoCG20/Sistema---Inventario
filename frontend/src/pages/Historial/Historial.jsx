import { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  FaExchangeAlt,
  FaUndo,
  FaSearch,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
} from 'react-icons/fa';

import '../Equipos/Equipos.scss';

const Historial = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para Filtros
  const [busqueda, setBusqueda] = useState(''); // Texto (Nombre/Serie)
  const [tipoFiltro, setTipoFiltro] = useState('todos'); // 'todos', 'entrega', 'devolucion'

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await api.get('/historial');
        // Ordenar siempre por fecha descendente (lo más nuevo arriba)
        const sorted = res.data.sort(
          (a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
        );
        setMovimientos(sorted);
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar historial');
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, []);

  // --- LÓGICA DE FILTRADO DOBLE ---
  const movimientosFiltrados = movimientos.filter((m) => {
    // 1. Filtro por Texto
    const coincideTexto =
      m.serie.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.empleado_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.empleado_apellido.toLowerCase().includes(busqueda.toLowerCase());

    // 2. Filtro por Tipo (Dropdown)
    const coincideTipo = tipoFiltro === 'todos' || m.tipo === tipoFiltro;

    return coincideTexto && coincideTipo;
  });

  // Resetear página si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, tipoFiltro]);

  // --- PAGINACIÓN ---
  const totalItems = movimientosFiltrados.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = movimientosFiltrados.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('es-PE', options);
  };

  if (loading)
    return <div style={{ padding: '2rem' }}>Cargando auditoría...</div>;

  return (
    <div className='equipos-container'>
      <div className='page-header'>
        <h1>Historial de Movimientos</h1>

        {/* BARRA DE HERRAMIENTAS (Buscador + Filtro Tipo) */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* 1. Selector de Tipo */}
          <div style={{ position: 'relative' }}>
            <FaFilter
              style={{
                position: 'absolute',
                left: '10px',
                top: '10px',
                color: '#64748b',
              }}
            />
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className='glass-input'
              style={{
                paddingLeft: '30px',
                height: '35px',
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                color: '#1e293b',
              }}
            >
              <option value='todos'>Todos los movimientos</option>
              <option value='entrega'>Solo Entregas</option>
              <option value='devolucion'>Solo Devoluciones</option>
            </select>
          </div>

          {/* 2. Buscador de Texto */}
          <div style={{ position: 'relative' }}>
            <FaSearch
              style={{
                position: 'absolute',
                left: '10px',
                top: '10px',
                color: '#94a3b8',
              }}
            />
            <input
              type='text'
              placeholder='Buscar serie o nombre...'
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className='glass-input'
              style={{
                paddingLeft: '35px',
                paddingRight: '10px',
                height: '35px',
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                minWidth: '250px',
              }}
            />
          </div>
        </div>
      </div>

      <div className='table-container'>
        {movimientosFiltrados.length === 0 ? (
          <div className='no-data'>
            <FaHistory
              style={{
                fontSize: '2rem',
                marginBottom: '1rem',
                color: '#cbd5e1',
              }}
            />
            <br />
            No se encontraron registros con esos filtros.
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Equipo (Serie)</th>
                  <th>Colaborador</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((mov) => (
                  <tr key={mov.id}>
                    <td>
                      <span
                        className={`status-badge ${mov.tipo === 'entrega' ? 'malogrado' : 'operativo'}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          width: 'fit-content',
                          backgroundColor:
                            mov.tipo === 'entrega'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(16, 185, 129, 0.1)',
                          color: mov.tipo === 'entrega' ? '#ef4444' : '#10b981',
                        }}
                      >
                        {mov.tipo === 'entrega' ? (
                          <FaExchangeAlt />
                        ) : (
                          <FaUndo />
                        )}
                        {mov.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {formatDate(mov.fecha_movimiento)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>
                          {mov.marca} {mov.modelo}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {mov.serie}
                        </span>
                      </div>
                    </td>
                    <td>
                      {mov.empleado_nombre} {mov.empleado_apellido}
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {mov.empresa}
                      </div>
                    </td>
                    <td
                      style={{
                        maxWidth: '250px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={mov.observaciones}
                    >
                      {mov.observaciones || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className='pagination-footer'>
              <div className='pagination-info'>
                Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
                <strong>{Math.min(indexOfLastItem, totalItems)}</strong> de{' '}
                <strong>{totalItems}</strong> resultados
              </div>

              <div className='pagination-controls'>
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft /> Anterior
                </button>

                <span className='page-badge'>
                  Página {currentPage} de {totalPages || 1}
                </span>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Siguiente <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Historial;
