// src/pages/Registro.jsx
// Cuenta nueva (cliente en TransAndino y en el Aeropuerto). React Hook Form + Zod: avisa campo por campo.
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { mensajeDeError } from '../api/client.js';
import { Campo } from '../components/Campo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { esquemaRegistro, fuerzaClave } from '../utils/esquemas.js';

const NIVELES = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

export function Registro() {
  const { usuario, registro } = useAuth();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquemaRegistro), mode: 'onTouched',
    defaultValues: { nombre: '', correo: '', password: '', confirmar: '', dni: '', celular: '' },
  });
  const fuerza = fuerzaClave(watch('password'));
  if (usuario) return <Navigate to="/app" replace />;

  async function crear({ confirmar: _c, ...cuenta }) {
    setError('');
    try {
      await registro(cuenta);
      avisar('Cuenta creada. ¡Bienvenido!');
      navegar('/app', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  return (
    <main className="acceso" id="contenido">
      <motion.form className="tarjeta-acceso" onSubmit={handleSubmit(crear)} noValidate
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
        <p className="kicker">Grupo 15</p>
        <h1>Crear cuenta</h1>
        <Campo id="nombre" etiqueta="Nombre completo" error={errors.nombre?.message}>{(a) => <input {...a} autoComplete="name" {...register('nombre')} />}</Campo>
        <Campo id="correo" etiqueta="Correo" error={errors.correo?.message}>{(a) => <input {...a} type="email" autoComplete="email" {...register('correo')} />}</Campo>
        <Campo id="password" etiqueta="Contraseña (mínimo 6)" error={errors.password?.message}>
          {(a) => (
            <>
              <input {...a} type="password" autoComplete="new-password" {...register('password')} />
              <span className="fuerza" aria-live="polite">
                <span className="fuerza-barra"><motion.span animate={{ width: `${(fuerza / 4) * 100}%` }} className={`nivel-${fuerza}`} /></span>
                <small>Seguridad: {NIVELES[fuerza]}</small>
              </span>
            </>
          )}
        </Campo>
        <Campo id="confirmar" etiqueta="Repite la contraseña" error={errors.confirmar?.message}>{(a) => <input {...a} type="password" autoComplete="new-password" {...register('confirmar')} />}</Campo>
        <div className="fila-2">
          <Campo id="dni" etiqueta="DNI (opcional)" error={errors.dni?.message}>{(a) => <input {...a} inputMode="numeric" maxLength={8} {...register('dni')} />}</Campo>
          <Campo id="celular" etiqueta="Celular (opcional)" error={errors.celular?.message}>{(a) => <input {...a} inputMode="tel" maxLength={9} {...register('celular')} />}</Campo>
        </div>
        {error && <p className="error-campo" role="alert">{error}</p>}
        <button className="btn btn-ancho" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando…' : 'Crear cuenta'}</button>
        <p className="pie-form">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </motion.form>
    </main>
  );
}
