import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.scss';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Llamamos a la función login del Context
    const success = await login(email, password);
    if (success) {
      navigate('/'); // Si todo sale bien, vamos al Dashboard
    }
  };

  return (
    <div className='login-container'>
      <div className='login-card'>
        <h2>Sistema Inventario</h2>
        <p>Ingresa tus credenciales de administrador</p>

        <form onSubmit={handleSubmit}>
          <div className='input-group'>
            <label>Correo Electrónico</label>
            <input
              type='email'
              placeholder='admin@sistema.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            />
          </div>
          <button type='submit'>Ingresar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
