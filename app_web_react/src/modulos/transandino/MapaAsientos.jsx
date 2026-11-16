// src/modulos/transandino/MapaAsientos.jsx
// Bus de 40 asientos: 1–12 cama (1.er piso) y 13–40 semicama (2.º piso)
const PISOS = [
  { nombre: '1.er piso · cama', desde: 1, hasta: 12 },
  { nombre: '2.º piso · semicama', desde: 13, hasta: 40 },
];

export function MapaAsientos({ ocupados = [], elegido, onElegir }) {
  return (
    <fieldset className="mapa-asientos">
      <legend>Elige tu asiento</legend>
      {PISOS.map((p) => (
        <div key={p.nombre} className="piso">
          <p className="piso-nombre">{p.nombre}</p>
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
      ))}
      <p className="leyenda"><span className="muestra libre" /> Libre <span className="muestra elegida" /> Tu asiento <span className="muestra ocupada" /> Ocupado</p>
    </fieldset>
  );
}
