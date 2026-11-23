-- Fase 12 · Fotos de ejemplo (paisajes, aeropuerto, estacionamiento, auto y bus)
-- Pégalo completo en el SQL Editor de Neon (proyecto grupo15). No borra nada.
ALTER TABLE imagenes DROP CONSTRAINT IF EXISTS imagenes_tipo_check;
ALTER TABLE imagenes ADD CONSTRAINT imagenes_tipo_check CHECK (tipo IN ('perfil', 'destino', 'escena'));
ALTER TABLE imagenes ADD COLUMN IF NOT EXISTS credito TEXT CHECK (char_length(credito) <= 300);

-- Comprobación: debe salir "listo · 1"
SELECT 'listo' AS migracion,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'imagenes' AND column_name = 'credito')::int AS columna_credito;
