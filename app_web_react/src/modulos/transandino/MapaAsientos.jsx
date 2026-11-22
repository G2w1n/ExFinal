// src/modulos/transandino/MapaAsientos.jsx
// El bus dibujado por pisos: 1–12 cama (1.er piso) y 13–40 semicama (2.º piso), con pasillo y chofer.
// El asiento elegido "salta" al marcarlo.
const PISOS = [
  { nombre: '1.er piso · cama', desde: 1, hasta: 12, clase: 'piso-cama' },
  { nombre: '2.º piso · semicama', desde: 13, hasta: 40, clase: 'piso-semicama' },
];

export function MapaAsientos({ ocupados = [], elegido, onElegir }) {
  return (
    <fieldset className="mapa-asientos">
      <legend>Elige tu asiento</legend>
      <div className="bus-pisos">
        {PISOS.map((p) => (
          <div key={p.nombre} className={`bus ${p.clase}`}>
            <p className="piso-nombre">{p.nombre}</p>
            <div className="bus-cuerpo">
              <div className="bus-frente" aria-hidden="true">
                {p.desde === 1 ? <><span className="volante">⎈</span><span>Chofer</span></> : <span>Frente</span>}
              </div>
              <div className="asientos">
                {Array.from({ length: p.hasta - p.desde + 1 }, (_, i) => p.desde + i).map((n) => {
                  const ocupado = ocupados.includes(n);
                  return (
                    <button key={n} type="button" className={`asiento ${n === elegido ? 'elegido' : ''}`} disabled={ocupado}
                      aria-pressed={n === elegido} aria-label={`Asiento ${n}${ocupado ? ', ocupado' : ''}`} onClick={() => onElegir(n)}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="leyenda"><span className="muestra libre" /> Libre <span className="muestra elegida" /> Tu asiento <span className="muestra ocupada" /> Ocupado</p>
    </fieldset>
  );
}
