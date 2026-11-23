// src/components/Campo.jsx
// Campo de formulario con su error debajo (accesible: aria-invalid y aria-describedby)
export function Campo({ id, etiqueta, error, ayuda, children }) {
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  return (
    <div className={`campo ${error ? 'con-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': [error && idError, ayuda && idAyuda].filter(Boolean).join(' ') || undefined })}
      {ayuda && !error && <small id={idAyuda}>{ayuda}</small>}
      {error && <small id={idError} className="error-campo" role="alert">{error}</small>}
    </div>
  );
}
