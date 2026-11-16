// src/pages/Login.jsx
// Un solo inicio de sesión para todas las apps del grupo
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO = [
  ['cliente1@correo.com', 'Pasajero (cliente en las 2 apps)'],
  ['admin@transandino.pe', 'Admin TransAndino (cliente del aeropuerto)'],
  ['empleado1@aeropuerto.pe', 'Empleado del aeropuerto'],
  ['empleado1@transandino.pe', 'Empleado de TransAndino'],
  ['admin@aeropuerto.pe', 'Admin del aeropuerto'],
];

export function Login() {
  const { usuario, login } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={state?.desde ?? '/app'} replace />;

  async function entrar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await login(correo, password);
      navegar(state?.desde ?? '/app', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="acceso" id="contenido">
      <form className="tarjeta-acceso" onSubmit={entrar} noValidate>
        <p className="kicker">Grupo 15 · acceso único</p>
        <h1>Iniciar sesión</h1>
        <p className="intro">Una sola cuenta para TransAndino y el Aeropuerto Cusco.</p>
        <label>Correo
          <input type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        </label>
        <label>Contraseña
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error-campo" role="alert">{error}</p>}
        <button className="btn btn-ancho" type="submit" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
        <p className="pie-form">¿No tienes cuenta? <Link to="/registro">Créala aquí</Link> · <Link to="/">Volver al inicio</Link></p>

        <details className="demo">
          <summary>Cuentas de prueba (contraseña 123456)</summary>
          <ul>
            {DEMO.map(([c, t]) => (
              <li key={c}><button type="button" className="enlace" onClick={() => { setCorreo(c); setPassword('123456'); }}>{c}</button> <span>{t}</span></li>
            ))}
          </ul>
        </details>
      </form>
    </main>
  );
}
