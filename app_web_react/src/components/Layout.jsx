// src/components/Layout.jsx
// Barra superior + menú lateral según los roles + contenido de la página
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { armarMenu, MODULOS } from '../utils/menu.js';

export function Layout() {
  const { usuario, salir } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const grupos = armarMenu(usuario);

  return (
    <div className="app">
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className="barra">
        <div className="barra-izq">
          <button type="button" className="btn-menu" aria-expanded={abierto} aria-controls="menu-roles" onClick={() => setAbierto(!abierto)}>
            <span aria-hidden="true">☰</span><span className="visualmente-oculto">Menú</span>
          </button>
          <Link to="/app" className="marca">Viaje a Cusco <small>Grupo 15</small></Link>
        </div>
        <div className="barra-der">
          <span className="usuario-chip" title={usuario.correo}>{usuario.nombre}</span>
          <button type="button" className="btn btn-claro" onClick={() => { salir(); navegar('/'); }}>Cerrar sesión</button>
        </div>
      </header>
      <div className="cuerpo">
        <nav id="menu-roles" className={`menu ${abierto ? 'abierto' : ''}`} aria-label="Menú según tus roles" onClick={() => setAbierto(false)}>
          <NavLink to="/app" end className="menu-opcion">Inicio</NavLink>
          {grupos.map((g) => (
            <div key={g.modulo} className={`menu-grupo grupo-${MODULOS[g.modulo]?.color ?? g.modulo}`}>
              <p className="menu-titulo">{g.titulo ?? MODULOS[g.modulo].nombre}{g.rol && <span> · {g.rol}</span>}</p>
              {g.opciones.map(([ruta, texto]) => (
                <NavLink key={ruta} to={ruta} end className="menu-opcion"
                  aria-current={pathname === ruta ? 'page' : undefined}>{texto}</NavLink>
              ))}
            </div>
          ))}
        </nav>
        <main id="contenido" className="contenido" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
