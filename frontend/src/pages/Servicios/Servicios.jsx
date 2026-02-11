import { useEffect, useState } from 'react';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import {
  FaPlus,
  FaEdit,
  FaCloud,
  FaCalendarAlt,
  FaFileExcel,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaBan,
  FaUndo,
  FaTimes,
  FaCheck,
  FaServer,
  FaMoneyBillWave,
} from 'react-icons/fa';
import Modal from '../../components/Modal/Modal';
import AddServicioForm from './AddServicioForm';
import PagoServicioModal from './PagoServicioModal'; // <--- Importado
import './Servicios.scss';

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- LÓGICA DE ROL ---
  const [userRole, setUserRole] = useState(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Modal de Pagos (NUEVO)
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [servicioParaPago, setServicioParaPago] = useState(null);

  // Selección
  const [servicioToEdit, setServicioToEdit] = useState(null);
  const [servicioToChangeStatus, setServicioToChangeStatus] = useState(null);
  const [newStatus, setNewStatus] = useState(''); // 'Cancelado' o 'Activo'

  // 1. CARGAR DATOS
  const fetchData = async () => {
    setLoading(true);
    try {
      const resPerfil = await api.get('/auth/perfil');
      setUserRole(Number(resPerfil.data.rol_id));

      const resServicios = await api.get('/servicios');
      const sorted = resServicios.data.sort((a, b) => {
        if (a.estado === b.estado) return b.id - a.id;
        return a.estado === 'Activo' ? -1 : 1;
      });
      setServicios(sorted);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return <span className='no-date'>-</span>;
    const date = new Date(
      dateString.includes('T') ? dateString : `${dateString}T12:00:00Z`,
    );
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMoney = (amount, currency) => {
    const symbol = currency === 'PEN' ? 'S/' : '$';
    return `${symbol} ${Number(amount).toFixed(2)}`;
  };

  const filteredServicios = servicios.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.nombre.toLowerCase().includes(term) ||
      (item.empresa_usuaria_nombre &&
        item.empresa_usuaria_nombre.toLowerCase().includes(term))
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredServicios.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredServicios.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const exportarExcel = () => {
    const dataParaExcel = filteredServicios.map((s) => ({
      ID: s.id,
      Servicio: s.nombre,
      Descripción: s.descripcion || '-',
      Estado: s.estado.toUpperCase(),
      Precio: Number(s.precio),
      Moneda: s.moneda,
      Frecuencia: s.frecuencia_pago,
      'Próximo Pago': s.fecha_proximo_pago
        ? new Date(s.fecha_proximo_pago).toLocaleDateString()
        : '-',
      'Método de Pago': s.metodo_pago || '-',
      Titular: s.titular_pago || '-',
      'Empresa Usuaria': s.empresa_usuaria_nombre || '-',
      'Empresa Facturación': s.empresa_facturacion_nombre || '-',
      'Licencias Totales': s.licencias_totales,
      'Licencias Usadas': s.licencias_usadas,
      'Licencias Libres': s.licencias_libres,
      'Registrado Por': s.creador_nombre
        ? `${s.creador_nombre} ${s.creador_apellido}`
        : 'Sistema',
      'Fecha Registro': new Date(s.created_at).toLocaleString(),
      'Modificado Por': s.modificador_nombre
        ? `${s.modificador_nombre} ${s.modificador_apellido}`
        : '-',
      'Fecha Modificación': s.updated_at
        ? new Date(s.updated_at).toLocaleString()
        : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios_SaaS');
    XLSX.writeFile(wb, 'Reporte_Servicios_SaaS.xlsx');
  };

  // --- MANEJO DE ACCIONES ---
  const handleAdd = () => {
    setServicioToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (servicio) => {
    setServicioToEdit(servicio);
    setIsFormModalOpen(true);
  };

  const handleOpenPagos = (servicio) => {
    setServicioParaPago(servicio);
    setIsPagoModalOpen(true);
  };

  const confirmChangeStatus = (servicio, status) => {
    setServicioToChangeStatus(servicio);
    setNewStatus(status);
    setIsStatusModalOpen(true);
  };

  const executeChangeStatus = async () => {
    if (!servicioToChangeStatus) return;
    try {
      await api.put(`/servicios/${servicioToChangeStatus.id}/estado`, {
        estado: newStatus,
      });
      toast.success(`Servicio ${newStatus.toLowerCase()} exitosamente`);
      fetchData();
      setIsStatusModalOpen(false);
      setServicioToChangeStatus(null);
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    fetchData();
  };

  if (loading)
    return <div className='loading-state'>Cargando servicios...</div>;

  return (
    <div className='servicios-container'>
      <div className='page-header'>
        <h1>Gestión de Servicios y Licencias</h1>
        <div className='header-actions'>
          <button
            onClick={exportarExcel}
            className='btn-action-header btn-excel'
          >
            <FaFileExcel /> Exportar Excel
          </button>
          <button
            className='btn-action-header btn-add'
            onClick={handleAdd}
          >
            <FaPlus /> Nuevo Servicio
          </button>
        </div>
      </div>

      <div className='search-bar'>
        <FaSearch color='#94a3b8' />
        <input
          type='text'
          placeholder='Buscar por Nombre de Servicio o Empresa...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className='table-container'>
        {currentItems.length === 0 ? (
          <div className='no-data'>
            No se encontraron servicios registrados.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className='center'>Tipo</th>
                <th>Servicio</th>
                <th>Facturación</th>
                <th>Próximo Pago</th>
                <th className='center'>Licencias</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th className='center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => {
                const estadoSeguro = item.estado || 'Activo';
                const isInactive = estadoSeguro !== 'Activo';
                return (
                  <tr
                    key={item.id}
                    className={isInactive ? 'inactive-row' : ''}
                  >
                    <td className='center'>
                      <div className='device-icon-box'>
                        {item.licencias_totales > 0 ? (
                          <FaCloud />
                        ) : (
                          <FaServer />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className='info-cell'>
                        <span className='name'>{item.nombre}</span>
                        <span className='audit-text'>
                          {item.descripcion?.substring(0, 35)}
                          {item.descripcion?.length > 35 ? '...' : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className='info-cell'>
                        <span
                          className='name'
                          style={{
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          {formatMoney(item.precio, item.moneda)}
                        </span>
                        <span className='audit-text'>
                          {item.frecuencia_pago}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className='email-cell'>
                        <FaCalendarAlt /> {formatDate(item.fecha_proximo_pago)}
                      </div>
                    </td>
                    <td className='center'>
                      {item.licencias_totales > 0 ? (
                        <div className='license-badge'>
                          <strong>{item.licencias_usadas}</strong> /{' '}
                          {item.licencias_totales}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className='empresa-text'>
                        {item.empresa_usuaria_nombre || '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${estadoSeguro.toLowerCase()}`}
                      >
                        {estadoSeguro.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className='actions-cell'>
                        {/* BOTÓN DE PAGOS */}
                        <button
                          className='action-btn'
                          style={{ color: '#3b82f6' }}
                          onClick={() => handleOpenPagos(item)}
                          title='Ver / Registrar Pagos'
                        >
                          <FaMoneyBillWave />
                        </button>

                        <button
                          className='action-btn edit'
                          onClick={() => handleEdit(item)}
                          title='Editar'
                        >
                          <FaEdit />
                        </button>

                        {/* RESTRICCIÓN DE ROL */}
                        {userRole === 1 &&
                          (item.estado === 'Activo' ? (
                            <button
                              className='action-btn delete'
                              onClick={() =>
                                confirmChangeStatus(item, 'Cancelado')
                              }
                              title='Cancelar Servicio'
                            >
                              <FaBan />
                            </button>
                          ) : (
                            <button
                              className='action-btn activate'
                              onClick={() =>
                                confirmChangeStatus(item, 'Activo')
                              }
                              title='Reactivar'
                            >
                              <FaUndo />
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filteredServicios.length > 0 && (
          <div className='pagination-footer'>
            <div className='info'>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
              <strong>
                {Math.min(indexOfLastItem, filteredServicios.length)}
              </strong>{' '}
              de <strong>{filteredServicios.length}</strong>
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

      {/* --- MODAL DEL FORMULARIO DE SERVICIO --- */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={servicioToEdit ? 'Editar Servicio' : 'Registrar Nuevo Servicio'}
      >
        <AddServicioForm
          onSuccess={handleFormSuccess}
          servicioToEdit={servicioToEdit}
        />
      </Modal>

      {/* --- MODAL DE PAGOS (NUEVO) --- */}
      <Modal
        isOpen={isPagoModalOpen}
        onClose={() => {
          setIsPagoModalOpen(false);
          fetchData(); // Recargamos la tabla por si cambió la fecha de próximo pago
        }}
        title={`Control de Pagos: ${servicioParaPago?.nombre}`}
      >
        <PagoServicioModal
          servicio={servicioParaPago}
          onClose={() => setIsPagoModalOpen(false)}
        />
      </Modal>

      {/* --- MODAL DE CONFIRMACIÓN DE ESTADO --- */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Confirmar ${newStatus}`}
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <FaExclamationTriangle />
          </div>
          <h3>¿Estás seguro?</h3>
          <p>
            El servicio <strong>{servicioToChangeStatus?.nombre}</strong> pasará
            a estar <strong>{newStatus.toUpperCase()}</strong>.
          </p>
          <div className='modal-actions'>
            <button
              className='btn-cancel'
              onClick={() => setIsStatusModalOpen(false)}
            >
              <FaTimes /> Cancelar
            </button>
            <button
              className={
                newStatus === 'Activo' ? 'btn-confirm green' : 'btn-confirm'
              }
              onClick={executeChangeStatus}
            >
              <FaCheck /> Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Servicios;
