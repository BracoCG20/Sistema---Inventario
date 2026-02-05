import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componentes y Páginas
import Login from './pages/Login/Login';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layout/MainLayout';

import Dashboard from './pages/Dashboard/Dashboard';
import Equipos from './pages/Equipos/Equipos';
import Usuarios from './pages/Usuarios/Usuarios';
import Entrega from './pages/Entrega/Entrega';
import Devolucion from './pages/Devolucion/Devolucion';
import Historial from './pages/Historial/Historial';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Contenedor de Alertas Flotantes */}
        <ToastContainer
          position='top-right'
          autoClose={3000}
          theme='light'
        />

        <Routes>
          {/* Ruta Pública */}
          <Route
            path='/login'
            element={<Login />}
          />

          {/* Rutas Protegidas (Solo Admin) */}
          <Route element={<ProtectedRoute />}>
            {/* Layout Principal que envuelve las páginas internas */}
            <Route element={<MainLayout />}>
              <Route
                path='/'
                element={<Dashboard />}
              />
              <Route
                path='/equipos'
                element={<Equipos />}
              />
              <Route
                path='/usuarios'
                element={<Usuarios />}
              />
              <Route
                path='/entrega'
                element={<Entrega />}
              />
              <Route
                path='/devolucion'
                element={<Devolucion />}
              />
              <Route
                path='/historial'
                element={<Historial />}
              />
              {/* Aquí agregaremos /usuarios, /entregas, etc. */}
            </Route>
          </Route>

          {/* Redirección por defecto: Si no existe, al login */}
          <Route
            path='*'
            element={
              <Navigate
                to='/login'
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
