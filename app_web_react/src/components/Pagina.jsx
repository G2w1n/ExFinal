// src/components/Pagina.jsx
// Encabezado común: ruta visible (App › Página) y título, con el color de la app
import { useEffect } from 'react';
import { MODULOS } from '../utils/menu.js';

export function Pagina({ modulo, titulo, intro, acciones, children }) {
  const app = MODULOS[modulo]?.nombre ?? { crm: 'CRM', ventanilla: 'Ventanilla' }[modulo] ?? 'Viaje a Cusco';
  useEffect(() => { document.title = `${titulo} · ${app} · Grupo 15`; }, [titulo, app]);
  return (
    <section className={`pagina pagina-${MODULOS[modulo]?.color ?? modulo}`}>
      <div className="pagina-cabecera">
        <div>
          <p className="miga">{app} › {titulo}</p>
          <h1>{titulo}</h1>
          {intro && <p className="intro">{intro}</p>}
        </div>
        {acciones && <div className="pagina-acciones">{acciones}</div>}
      </div>
      {children}
    </section>
  );
}
