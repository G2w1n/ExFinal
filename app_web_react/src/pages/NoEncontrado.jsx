import { Link } from 'react-router-dom';

export function NoEncontrado() {
  return (
    <main className="acceso" id="contenido">
      <section className="tarjeta-acceso">
        <h1>Página no encontrada</h1>
        <p className="intro">La dirección no existe o cambió.</p>
        <Link className="btn" to="/">Volver al inicio</Link>
      </section>
    </main>
  );
}
