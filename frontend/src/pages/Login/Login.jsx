import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Login.scss';

import logo from '../../assets/logo_gruposp.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Bloquear botón

    // Llamamos a la función login del Context (que ahora devuelve un objeto con success/message)
    const result = await login(email, password);

    // NOTA: Si tu AuthContext anterior solo devolvía true/false, adáptalo aquí.
    // Asumo que actualizaste AuthContext según mi respuesta anterior.

    if (result && result.success) {
      toast.success('Bienvenido al sistema');
      navigate('/');
    } else {
      toast.error(result?.message || 'Error al iniciar sesión');
      setIsLoading(false); // Desbloquear solo si falla
    }
  };

  return (
    <div className='login-container'>
      <div className='login-image'>
        <img
          src={logo}
          alt='Logo'
        />
      </div>
      <div className='login-card'>
        <h2>Sistema Inventario</h2>

        <form onSubmit={handleSubmit}>
          <div className='input-group'>
            <label>Correo Electrónico</label>
            <input
              type='email'
              placeholder='admin@sistema.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className='input-group'>
            <label>Contraseña</label>
            <input
              type='password'
              placeholder='••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type='submit'
            disabled={isLoading}
            style={{
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'wait' : 'pointer',
            }}
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
