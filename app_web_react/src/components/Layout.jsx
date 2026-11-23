// src/components/Layout.jsx
// Barra superior + menú lateral según los roles + contenido de la página
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEnVivo } from '../context/TiempoReal.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { SelectorIdioma } from './SelectorIdioma.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { armarMenu, MODULOS } from '../utils/menu.js';
import { BotonTema } from './BotonTema.jsx';
import { BusquedaGlobal } from './BusquedaGlobal.jsx';
import { Notificaciones } from './Notificaciones.jsx';

export function Layout() {
  const { usuario, salir } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const grupos = armarMenu(usuario);
  const enVivo = useEnVivo();
  const { t } = useTranslation();

  return (
    <div className="app">
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className="barra">
        <div className="barra-izq">
          <button type="button" className="btn-menu" aria-expanded={abierto} aria-controls="menu-roles" onClick={() => setAbierto(!abierto)}>
            <span aria-hidden="true">☰</span><span className="visualmente-oculto">{t('menu')}</span>
          </button>
          <Link to="/app" className="marca">Viaje a Cusco <small>Grupo 15</small></Link>
        </div>
        <div className="barra-der">
          <span className={`en-vivo ${enVivo ? 'activo' : ''}`} title={enVivo ? t('enVivoSi') : t('enVivoNo')}><span className="punto-vivo" aria-hidden="true" />{enVivo ? t('enVivo') : t('sinConexion')}</span>
          <SelectorIdioma />
          <BusquedaGlobal />
          <Notificaciones />
          <BotonTema />
          <span className="usuario-chip" title={usuario.correo}>{usuario.nombre}</span>
          <button type="button" className="btn btn-claro" onClick={() => { salir(); navegar('/'); }}>{t('cerrarSesion')}</button>
        </div>
      </header>
      <div className="cuerpo">
        <nav id="menu-roles" className={`menu ${abierto ? 'abierto' : ''}`} aria-label="Menú según tus roles" onClick={() => setAbierto(false)}>
          <NavLink to="/app" end className="menu-opcion">{t('inicio')}</NavLink>
          {grupos.map((g) => (
            <div key={g.modulo} className={`menu-grupo grupo-${MODULOS[g.modulo]?.color ?? g.modulo}`}>
              <p className="menu-titulo">{g.titulo ? t(g.titulo) : MODULOS[g.modulo].nombre}{g.rol && <span> · {t(`rol.${g.rol}`)}</span>}</p>
              {g.opciones.map(([ruta, texto]) => (
                <NavLink key={ruta} to={ruta} end className="menu-opcion"
                  aria-current={pathname === ruta ? 'page' : undefined}>{t(texto)}</NavLink>
              ))}
            </div>
          ))}
        </nav>
        <main id="contenido" className="contenido" tabIndex={-1}>
          {/* Cada página entra y sale con una transición (Framer Motion); si falla, mensaje amable */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
              <ErrorBoundary llave={pathname}><Outlet /></ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
