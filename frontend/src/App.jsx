import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexto de Autenticación
import { AuthProvider } from './context/AuthContext'; // Asegúrate de que la ruta sea correcta

// Layouts y Páginas
import MainLayout from './layout/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Equipos from './pages/Equipos/Equipos';
import Usuarios from './pages/Usuarios/Usuarios';
import Entrega from './pages/Entrega/Entrega';
import Devolucion from './pages/Devolucion/Devolucion';
import Historial from './pages/Historial/Historial';
import Servicios from './pages/Servicios/Servicios';

// 1. IMPORTAR LA NUEVA PÁGINA
import Configuracion from './pages/Configuracion/Configuracion';

function App() {
  return (
    <BrowserRouter>
      {/* 2. AUTHPROVIDER ENVOLVIENDO LAS RUTAS */}
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route
            path='/login'
            element={<Login />}
          />

          {/* Rutas Protegidas (Dentro del Layout) */}
          <Route
            path='/'
            element={<MainLayout />}
          >
            <Route
              index
              element={<Dashboard />}
            />
            <Route
              path='equipos'
              element={<Equipos />}
            />
            <Route
              path='usuarios'
              element={<Usuarios />}
            />
            <Route
              path='/servicios'
              element={<Servicios />}
            />
            <Route
              path='entrega'
              element={<Entrega />}
            />
            <Route
              path='devolucion'
              element={<Devolucion />}
            />
            <Route
              path='historial'
              element={<Historial />}
            />

            {/* 3. AGREGADA LA RUTA DE CONFIGURACIÓN */}
            <Route
              path='configuracion'
              element={<Configuracion />}
            />
          </Route>

          {/* Redirección por defecto */}
          <Route
            path='*'
            element={<Navigate to='/' />}
          />
        </Routes>

        {/* Notificaciones Globales */}
        <ToastContainer
          position='top-right'
          autoClose={3000}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
