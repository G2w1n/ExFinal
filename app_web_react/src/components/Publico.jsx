// src/components/Publico.jsx
// Cabecera y pie de las páginas públicas (portada, vuelos, estacionamiento)
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { BotonTema } from './BotonTema.jsx';
import { SelectorIdioma } from './SelectorIdioma.jsx';

export function CabeceraPublica() {
  const { usuario } = useAuth();
  const { t } = useTranslation();
  return (
    <header className="barra barra-publica">
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <Link to="/" className="marca">Viaje a Cusco <small>Grupo 15</small></Link>
      <nav aria-label="Principal">
        <NavLink to="/vuelos">{t('Vuelos')}</NavLink>
        <NavLink to="/estacionamiento">{t('Estacionamiento')}</NavLink>
        <Link to="/#rutas">{t('Rutas')}</Link>
        <Link to="/#servicios">{t('Servicios')}</Link>
        <SelectorIdioma />
        <BotonTema />
        {usuario
          ? <Link className="btn btn-claro" to="/app">{t('Ir a mi cuenta')}</Link>
          : <Link className="btn btn-claro" to="/login">{t('Iniciar sesión')}</Link>}
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
