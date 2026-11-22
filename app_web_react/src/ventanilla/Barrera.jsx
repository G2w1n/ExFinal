// src/ventanilla/Barrera.jsx
// Barrera de la garita: se levanta y el carro sale cuando se registra la salida
export function Barrera({ abierta, placa }) {
  return (
    <div className={`barrera ${abierta ? 'abierta' : ''}`} role="img" aria-label={abierta ? `Barrera abierta: sale ${placa}` : 'Barrera cerrada'}>
      <div className="barrera-poste" aria-hidden="true" />
      <div className="barrera-brazo" aria-hidden="true" />
      <div className="barrera-carro" aria-hidden="true">🚗{placa && <span>{placa}</span>}</div>
      <div className="barrera-pista" aria-hidden="true" />
      <p className="barrera-texto">{abierta ? `¡Buen viaje! Sale ${placa}` : 'Barrera cerrada'}</p>
    </div>
  );
}
