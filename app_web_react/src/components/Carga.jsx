// src/components/Carga.jsx
// Estados comunes de una pantalla que espera datos de la API
export function Carga({ cargando, error, vacio, textoVacio = 'No hay registros todavía.', reintentar, children }) {
  if (cargando) {
    return (
      <div className="esqueleto" role="status" aria-label="Cargando">
        {[0, 1, 2, 3].map((i) => <span key={i} className="esqueleto-fila" style={{ width: `${92 - i * 14}%` }} />)}
      </div>
    );
  }
  if (error) {
    return (
      <div className="caja-error" role="alert">
        <p>{error}</p>
        {reintentar && <button type="button" className="btn btn-borde" onClick={() => reintentar()}>Reintentar</button>}
      </div>
    );
  }
  if (vacio) return <p className="vacio">{textoVacio}</p>;
  return children;
}
