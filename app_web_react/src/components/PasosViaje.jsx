// src/components/PasosViaje.jsx
// Asistente del viaje: Pasaje → Pago → Estacionamiento → ¡Listo!, con barra de progreso
const PASOS = ['Pasaje', 'Pago', 'Estacionamiento', '¡Listo!'];

export function PasosViaje({ actual }) {
  return (
    <nav className="pasos-viaje" aria-label="Progreso de tu viaje">
      <div className="pasos-barra" aria-hidden="true"><span style={{ width: `${(actual / (PASOS.length - 1)) * 100}%` }} /></div>
      <ol>
        {PASOS.map((p, i) => (
          <li key={p} className={i < actual ? 'hecho' : i === actual ? 'actual' : ''} aria-current={i === actual ? 'step' : undefined}>
            <span className="paso-punto" aria-hidden="true">{i < actual ? '✓' : i + 1}</span>
            <span>{p}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
