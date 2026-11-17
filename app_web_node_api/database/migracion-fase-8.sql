-- =====================================================================
-- Grupo 15 · Migración de la fase 8 (caja y garita) para la base que YA tiene datos.
-- Neon -> SQL Editor: pega todo y pulsa "Run". No borra nada; se puede ejecutar dos veces.
-- =====================================================================

-- Pagos en ventanilla: POS, cajero, monto recibido y vuelto
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS pagos_metodo_check;
ALTER TABLE pagos ADD CONSTRAINT pagos_metodo_check CHECK (metodo IN ('tarjeta', 'billetera', 'efectivo', 'pos'));
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS id_cajero INTEGER REFERENCES usuarios (id);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS monto_recibido NUMERIC(10, 2);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS vuelto NUMERIC(10, 2);

-- Caja: apertura con fondo inicial y arqueo al cerrar
CREATE TABLE IF NOT EXISTS cajas (
  id                 SERIAL PRIMARY KEY,
  cajero_id          INTEGER NOT NULL REFERENCES usuarios (id),
  apertura           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  monto_inicial      NUMERIC(10, 2) NOT NULL CHECK (monto_inicial >= 0),
  cierre             TIMESTAMPTZ,
  efectivo_esperado  NUMERIC(10, 2),
  efectivo_contado   NUMERIC(10, 2),
  diferencia         NUMERIC(10, 2),
  nota               TEXT CHECK (char_length(nota) <= 200),
  estado             TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada'))
);
CREATE UNIQUE INDEX IF NOT EXISTS cajas_una_abierta ON cajas (cajero_id) WHERE estado = 'abierta';

-- Comprobación: debe salir "listo" y 5 columnas nuevas o existentes
SELECT 'listo' AS migracion,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pagos' AND column_name IN ('id_cajero', 'monto_recibido', 'vuelto'))::int AS columnas_pagos,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'cajas')::int AS tabla_cajas;
