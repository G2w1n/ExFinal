// src/components/RutaProtegida.jsx
// Valida sesión y, si se indica, el rol en el módulo. Sin sesión: al login. Sin rol: aviso 403.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function RutaProtegida({ modulo, roles, personal = false, admin = false, children }) {
  const { usuario, tiene } = useAuth();
  const ubicacion = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname + ubicacion.search }} />;
  const esPersonal = ['transandino', 'aeropuerto'].some((m) => tiene(m, 'administrador', 'empleado'));
  const esAdmin = ['transandino', 'aeropuerto'].some((m) => tiene(m, 'administrador'));
  const permitido = admin ? esAdmin : personal ? esPersonal : !modulo || tiene(modulo, ...roles);
  if (!permitido) {
    return (
      <section className="caja-mensaje" role="alert">
        <h1>No tienes acceso a esta opción</h1>
        <p>Tu cuenta no tiene el rol necesario. Usa las opciones de tu menú.</p>
      </section>
    );
  }
  return children;
}
