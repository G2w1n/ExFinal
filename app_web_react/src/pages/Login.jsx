// src/pages/Login.jsx
// Un solo inicio de sesión para todas las apps del grupo (React Hook Form + Zod)
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { mensajeDeError } from '../api/client.js';
import { Campo } from '../components/Campo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { esquemaLogin } from '../utils/esquemas.js';

const DEMO = [
  ['cliente1@correo.com', 'Pasajero (cliente en las 2 apps)'],
  ['admin@transandino.pe', 'Admin TransAndino (cliente del aeropuerto)'],
  ['empleado1@aeropuerto.pe', 'Empleado del aeropuerto'],
  ['empleado1@transandino.pe', 'Empleado de TransAndino'],
  ['admin@aeropuerto.pe', 'Admin del aeropuerto'],
];

export function Login() {
  const { usuario, login } = useAuth();
  const { t } = useTranslation();
  const navegar = useNavigate();
  const { state } = useLocation();
  const [error, setError] = useState('');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquemaLogin), defaultValues: { correo: '', password: '' }, mode: 'onTouched',
  });

  if (usuario) return <Navigate to={state?.desde ?? '/app'} replace />;

  async function entrar({ correo, password }) {
    setError('');
    try {
      await login(correo, password);
      navegar(state?.desde ?? '/app', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  return (
    <main className="acceso" id="contenido">
      <motion.form className="tarjeta-acceso" onSubmit={handleSubmit(entrar)} noValidate
        initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
        <p className="kicker">Grupo 15 · acceso único</p>
        <h1>{t('Iniciar sesión')}</h1>
        <p className="intro">{t('Una sola cuenta para TransAndino y el Aeropuerto Cusco.')}</p>
        <Campo id="correo" etiqueta={t('Correo')} error={errors.correo?.message}>
          {(a) => <input {...a} type="email" autoComplete="email" {...register('correo')} />}
        </Campo>
        <Campo id="password" etiqueta={t('Contraseña')} error={errors.password?.message}>
          {(a) => <input {...a} type="password" autoComplete="current-password" {...register('password')} />}
        </Campo>
        {error && <motion.p className="error-campo" role="alert" initial={{ x: -8 }} animate={{ x: [8, -6, 4, 0] }}>{error}</motion.p>}
        <button className="btn btn-ancho" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Ingresando…' : t('Ingresar')}</button>
        <p className="pie-form">¿No tienes cuenta? <Link to="/registro">Créala aquí</Link> · <Link to="/">Volver al inicio</Link></p>

        <details className="demo">
          <summary>Cuentas de prueba (contraseña 123456)</summary>
          <ul>
            {DEMO.map(([c, texto]) => (
              <li key={c}><button type="button" className="enlace" onClick={() => { setValue('correo', c, { shouldValidate: true }); setValue('password', '123456', { shouldValidate: true }); }}>{c}</button> <span>{texto}</span></li>
            ))}
          </ul>
        </details>
      </motion.form>
    </main>
  );
}
