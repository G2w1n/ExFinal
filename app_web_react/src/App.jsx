// src/App.jsx
// React Router: todas las rutas de la SPA. Cada página valida el rol del usuario en su módulo.
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { RutaProtegida } from './components/RutaProtegida.jsx';
import { Inicio } from './pages/Inicio.jsx';
import { Login } from './pages/Login.jsx';
import { Registro } from './pages/Registro.jsx';
import { Bienvenida } from './pages/Bienvenida.jsx';
import { NoEncontrado } from './pages/NoEncontrado.jsx';
import { ComprarPasaje } from './modulos/transandino/ComprarPasaje.jsx';
import { MisPasajes } from './modulos/transandino/MisPasajes.jsx';
import { EditarPasaje } from './modulos/transandino/EditarPasaje.jsx';
import { PanelPasajes } from './modulos/transandino/PanelPasajes.jsx';
import { Reservar } from './modulos/aeropuerto/Reservar.jsx';
import { MisReservas } from './modulos/aeropuerto/MisReservas.jsx';
import { EditarReserva } from './modulos/aeropuerto/EditarReserva.jsx';
import { PanelReservas } from './modulos/aeropuerto/PanelReservas.jsx';
import { MisViajes } from './integraciones/MisViajes.jsx';
import { EspacioBuses } from './integraciones/EspacioBuses.jsx';
import { LlegadasEsperadas } from './integraciones/LlegadasEsperadas.jsx';
import { Clientes } from './crm/Clientes.jsx';
import { FichaCliente } from './crm/FichaCliente.jsx';
import { Indicadores } from './crm/Indicadores.jsx';
import { Caja } from './ventanilla/Caja.jsx';

// Se cargan solo cuando se abren: el lector QR (garita) y el generador de QR (comprobante) pesan
const Garita = lazy(() => import('./ventanilla/Garita.jsx').then((m) => ({ default: m.Garita })));
const Comprobante = lazy(() => import('./pages/Comprobante.jsx').then((m) => ({ default: m.Comprobante })));
const cargando = <p className="carga" role="status"><span className="girando" aria-hidden="true" /> Cargando…</p>;
import { Vuelos } from './pages/Vuelos.jsx';
import { Estacionamiento } from './pages/Estacionamiento.jsx';

const TODOS = ['cliente', 'administrador', 'empleado'];
const PERSONAL = ['administrador', 'empleado'];
const ruta = (modulo, roles, elemento) => <RutaProtegida modulo={modulo} roles={roles}>{elemento}</RutaProtegida>;

export default function App() {
  return (
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
        <Route path="aeropuerto/llegadas" element={ruta('aeropuerto', PERSONAL, <LlegadasEsperadas />)} />
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
  );
}
