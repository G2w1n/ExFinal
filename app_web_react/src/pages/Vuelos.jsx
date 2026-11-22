// src/pages/Vuelos.jsx
// Página pública del tablero de vuelos
import { useEffect } from 'react';
import { CabeceraPublica, PiePublico } from '../components/Publico.jsx';
import { Tablero } from '../vuelos/Tablero.jsx';

export function Vuelos() {
  useEffect(() => { document.title = 'Vuelos en vivo · Viaje a Cusco'; }, []);
  return (
    <div className="publico">
      <CabeceraPublica />
      <main id="contenido" className="bloque">
        <h1>Vuelos en vivo</h1>
        <p className="intro">Salidas y llegadas del Aeropuerto Internacional del Cusco. ¿Llegas en bus? Revisa tu vuelo y reserva tu estacionamiento.</p>
        <Tablero />
      </main>
      <PiePublico />
    </div>
  );
}
