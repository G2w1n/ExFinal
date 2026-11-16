// src/pages/Registro.jsx
// Cuenta nueva: queda como cliente en TransAndino y en el Aeropuerto
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';

export function Registro() {
  const { usuario, registro } = useAuth();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const [cuenta, setCuenta] = useState({ nombre: '', correo: '', password: '', dni: '', celular: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  if (usuario) return <Navigate to="/app" replace />;
  const cambiar = (campo) => (e) => setCuenta({ ...cuenta, [campo]: e.target.value });

  async function crear(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await registro(cuenta);
      avisar('Cuenta creada. ¡Bienvenido!');
      navegar('/app', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="acceso" id="contenido">
      <form className="tarjeta-acceso" onSubmit={crear}>
        <p className="kicker">Grupo 15</p>
        <h1>Crear cuenta</h1>
        <label>Nombre completo<input value={cuenta.nombre} onChange={cambiar('nombre')} autoComplete="name" required minLength={2} maxLength={80} /></label>
        <label>Correo<input type="email" value={cuenta.correo} onChange={cambiar('correo')} autoComplete="email" required /></label>
        <label>Contraseña (mínimo 6)<input type="password" value={cuenta.password} onChange={cambiar('password')} autoComplete="new-password" required minLength={6} /></label>
        <div className="fila-2">
          <label>DNI (opcional)<input inputMode="numeric" value={cuenta.dni} onChange={cambiar('dni')} pattern="\d{8}" maxLength={8} /></label>
          <label>Celular (opcional)<input inputMode="tel" value={cuenta.celular} onChange={cambiar('celular')} pattern="9\d{8}" maxLength={9} /></label>
        </div>
        {error && <p className="error-campo" role="alert">{error}</p>}
        <button className="btn btn-ancho" type="submit" disabled={enviando}>{enviando ? 'Creando…' : 'Crear cuenta'}</button>
        <p className="pie-form">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </form>
    </main>
  );
}
