// src/App.jsx
// React Router: todas las rutas de la SPA. Cada página valida el rol del usuario en su módulo.
import { lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { RutaProtegida } from './components/RutaProtegida.jsx';
import { Inicio } from './pages/Inicio.jsx';
import { Bienvenida } from './pages/Bienvenida.jsx';
import { NoEncontrado } from './pages/NoEncontrado.jsx';

// Cada pantalla se descarga solo cuando se abre (la portada y el login cargan rápido)
const perezoso = (cargar, nombre) => lazy(() => cargar().then((m) => ({ default: m[nombre] })));
const ComprarPasaje = perezoso(() => import('./modulos/transandino/ComprarPasaje.jsx'), 'ComprarPasaje');
const MisPasajes = perezoso(() => import('./modulos/transandino/MisPasajes.jsx'), 'MisPasajes');
const EditarPasaje = perezoso(() => import('./modulos/transandino/EditarPasaje.jsx'), 'EditarPasaje');
const PanelPasajes = perezoso(() => import('./modulos/transandino/PanelPasajes.jsx'), 'PanelPasajes');
const Reservar = perezoso(() => import('./modulos/aeropuerto/Reservar.jsx'), 'Reservar');
const MisReservas = perezoso(() => import('./modulos/aeropuerto/MisReservas.jsx'), 'MisReservas');
const EditarReserva = perezoso(() => import('./modulos/aeropuerto/EditarReserva.jsx'), 'EditarReserva');
const PanelReservas = perezoso(() => import('./modulos/aeropuerto/PanelReservas.jsx'), 'PanelReservas');
const TableroReservas = perezoso(() => import('./modulos/aeropuerto/TableroReservas.jsx'), 'TableroReservas');
const MisViajes = perezoso(() => import('./integraciones/MisViajes.jsx'), 'MisViajes');
const EspacioBuses = perezoso(() => import('./integraciones/EspacioBuses.jsx'), 'EspacioBuses');
const LlegadasEsperadas = perezoso(() => import('./integraciones/LlegadasEsperadas.jsx'), 'LlegadasEsperadas');
const Clientes = perezoso(() => import('./crm/Clientes.jsx'), 'Clientes');
const FichaCliente = perezoso(() => import('./crm/FichaCliente.jsx'), 'FichaCliente');
const Caja = perezoso(() => import('./ventanilla/Caja.jsx'), 'Caja');
const Vuelos = perezoso(() => import('./pages/Vuelos.jsx'), 'Vuelos');
const Estacionamiento = perezoso(() => import('./pages/Estacionamiento.jsx'), 'Estacionamiento');
const MiPerfil = perezoso(() => import('./pages/MiPerfil.jsx'), 'MiPerfil');
const FotosPagina = perezoso(() => import('./pages/FotosPagina.jsx'), 'FotosPagina');
const Login = perezoso(() => import('./pages/Login.jsx'), 'Login');
const Registro = perezoso(() => import('./pages/Registro.jsx'), 'Registro');
// También el lector QR (garita), los gráficos y el generador de QR (comprobante)
const Garita = lazy(() => import('./ventanilla/Garita.jsx').then((m) => ({ default: m.Garita })));
const Indicadores = lazy(() => import('./crm/Indicadores.jsx').then((m) => ({ default: m.Indicadores })));
const Comprobante = lazy(() => import('./pages/Comprobante.jsx').then((m) => ({ default: m.Comprobante })));
const cargando = <p className="carga" role="status"><span className="girando" aria-hidden="true" /> Cargando…</p>;

const TODOS = ['cliente', 'administrador', 'empleado'];
const PERSONAL = ['administrador', 'empleado'];
const ruta = (modulo, roles, elemento) => <RutaProtegida modulo={modulo} roles={roles}>{elemento}</RutaProtegida>;

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <ErrorBoundary llave="app">
    <Suspense fallback={cargando}>
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/vuelos" element={<Vuelos />} />
      <Route path="/estacionamiento" element={<Estacionamiento />} />
      <Route path="/app" element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Bienvenida />} />
        <Route path="transandino/comprar" element={ruta('transandino', TODOS, <ComprarPasaje />)} />
        <Route path="transandino/mis-pasajes" element={ruta('transandino', TODOS, <MisPasajes />)} />
        <Route path="transandino/pasajes/:id/editar" element={ruta('transandino', TODOS, <EditarPasaje />)} />
        <Route path="transandino/panel" element={ruta('transandino', PERSONAL, <PanelPasajes />)} />
        <Route path="aeropuerto/reservar" element={ruta('aeropuerto', TODOS, <Reservar />)} />
        <Route path="aeropuerto/mis-reservas" element={ruta('aeropuerto', TODOS, <MisReservas />)} />
        <Route path="aeropuerto/reservas/:id/editar" element={ruta('aeropuerto', TODOS, <EditarReserva />)} />
        <Route path="aeropuerto/panel" element={ruta('aeropuerto', PERSONAL, <PanelReservas />)} />
        <Route path="aeropuerto/tablero" element={ruta('aeropuerto', PERSONAL, <TableroReservas />)} />
        <Route path="aeropuerto/llegadas" element={ruta('aeropuerto', PERSONAL, <LlegadasEsperadas />)} />
        <Route path="perfil" element={<MiPerfil />} />
        <Route path="fotos" element={<RutaProtegida admin><FotosPagina /></RutaProtegida>} />
        <Route path="transandino/destinos" element={<Navigate to="/app/fotos" replace />} />
        <Route path="aeropuerto/espacio-bus" element={ruta('transandino', ['administrador'], <EspacioBuses />)} />
        <Route path="mis-viajes" element={<MisViajes />} />
        <Route path="comprobante/:tipo/:id" element={<Comprobante />} />
        <Route path="caja" element={<RutaProtegida personal><Caja /></RutaProtegida>} />
        <Route path="garita" element={ruta('aeropuerto', PERSONAL, <Garita />)} />
        <Route path="crm" element={<RutaProtegida personal><Clientes /></RutaProtegida>} />
        <Route path="crm/indicadores" element={<RutaProtegida personal><Indicadores /></RutaProtegida>} />
        <Route path="crm/clientes/:id" element={<RutaProtegida personal><FichaCliente /></RutaProtegida>} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
      <Route path="*" element={<NoEncontrado />} />
    </Routes>
    </Suspense>
    </ErrorBoundary>
    </MotionConfig>
  );
}
