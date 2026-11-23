-- Fase 11 · Imágenes dentro de Neon
-- Pégalo completo en el SQL Editor de Neon (proyecto grupo15). No borra nada: solo agrega la tabla.
CREATE TABLE IF NOT EXISTS imagenes (
  tipo         TEXT NOT NULL CHECK (tipo IN ('perfil', 'destino')),
  id_entidad   INTEGER NOT NULL,
  mime         TEXT NOT NULL CHECK (mime IN ('image/webp', 'image/jpeg', 'image/png')),
  datos        BYTEA NOT NULL CHECK (octet_length(datos) <= 307200),
  id_autor     INTEGER REFERENCES usuarios (id) ON DELETE SET NULL,
  actualizado  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tipo, id_entidad)
);

-- Comprobación: debe salir "listo" y 1
SELECT 'listo' AS migracion,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'imagenes')::int AS tabla_imagenes;
