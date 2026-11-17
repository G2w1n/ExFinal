// src/components/Publico.jsx
// Cabecera y pie de las páginas públicas (portada, vuelos, estacionamiento)
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function CabeceraPublica() {
  const { usuario } = useAuth();
  return (
    <header className="barra barra-publica">
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <Link to="/" className="marca">Viaje a Cusco <small>Grupo 15</small></Link>
      <nav aria-label="Principal">
        <NavLink to="/vuelos">Vuelos</NavLink>
        <NavLink to="/estacionamiento">Estacionamiento</NavLink>
        <Link to="/#rutas">Rutas</Link>
        <Link to="/#servicios">Servicios</Link>
        {usuario
          ? <Link className="btn btn-claro" to="/app">Ir a mi cuenta</Link>
          : <Link className="btn btn-claro" to="/login">Iniciar sesión</Link>}
      </nav>
    </header>
  );
}

export function PiePublico() {
  return (
    <footer className="pie">
      <p><strong>Grupo 15 · Viaje a Cusco</strong> — Diseño Web, trabajo final. Caso académico ficticio.</p>
      <p>TransAndino Perú: Pérez Huamani, Julius Axl Nicolai · Aeropuerto Internacional del Cusco: Mueras Villanueva, Jefferson Percy</p>
      <p>TransAndino Cusco: Av. El Sol 450 · (084) 567-890 · Aeropuerto: Av. de la Aviación s/n, Cusco · (084) 000-000</p>
    </footer>
  );
}
