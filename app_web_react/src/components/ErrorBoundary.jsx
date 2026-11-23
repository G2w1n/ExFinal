// src/components/ErrorBoundary.jsx
// Si una pantalla falla, se muestra un mensaje amable en lugar de una página en blanco
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error en la pantalla:', error, info.componentStack);
  }

  componentDidUpdate(anterior) {
    // Al cambiar de página se intenta de nuevo
    if (this.state.error && anterior.llave !== this.props.llave) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="caja-mensaje error-pantalla" role="alert">
        <p className="error-icono" aria-hidden="true">⚠</p>
        <h1>Algo salió mal en esta pantalla</h1>
        <p>No es tu culpa. Puedes intentar de nuevo o volver al inicio.</p>
        <div className="acciones">
          <button type="button" className="btn" onClick={() => this.setState({ error: null })}>Intentar de nuevo</button>
          <a className="btn btn-borde" href="/app">Ir al inicio</a>
        </div>
      </section>
    );
  }
}
