-- =====================================================================
-- Grupo 15 · Viaje a Cusco
-- Una sola base de datos para TransAndino (pasajes) y el Aeropuerto (estacionamiento)
-- ---------------------------------------------------------------------
-- ATENCIÓN: "npm run db:init" ejecuta este archivo, que BORRA y vuelve a crear
-- las tablas, y luego carga los datos de prueba. Úsalo en la base del grupo.
-- =====================================================================

DROP TABLE IF EXISTS cajas, notas_cliente, estados_historial, pagos, reservas_estacionamiento,
  compras_pasajes, rutas, usuario_rol, usuarios CASCADE;

-- ---------- Común: un usuario, varios roles ----------
CREATE TABLE usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         TEXT NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 80),
  correo         TEXT NOT NULL UNIQUE CHECK (correo = lower(correo)),
  password_hash  TEXT NOT NULL,
  dni            TEXT CHECK (char_length(dni) = 8 AND dni ~ '^[0-9]+'),
  celular        TEXT CHECK (char_length(celular) = 9 AND celular ~ '^9[0-9]+'),
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  creado         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- El rol de cada usuario en cada módulo (app). El menú de React se arma con esto.
CREATE TABLE usuario_rol (
  id_usuario  INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  modulo      TEXT NOT NULL CHECK (modulo IN ('transandino', 'aeropuerto')),
  rol         TEXT NOT NULL CHECK (rol IN ('cliente', 'administrador', 'empleado')),
  PRIMARY KEY (id_usuario, modulo)
);

-- ---------- TransAndino (Pérez Huamani) ----------
CREATE TABLE rutas (
  id              SERIAL PRIMARY KEY,
  origen          TEXT NOT NULL,
  destino         TEXT NOT NULL,
  duracion_horas  NUMERIC(4, 1) NOT NULL CHECK (duracion_horas > 0),
  hora_salida     TIME NOT NULL,                  -- salida diaria
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (origen, destino)
);

CREATE TABLE compras_pasajes (
  id             SERIAL PRIMARY KEY,
  codigo         TEXT NOT NULL UNIQUE,            -- PAS-00001
  id_usuario     INTEGER NOT NULL REFERENCES usuarios (id),
  id_ruta        INTEGER NOT NULL REFERENCES rutas (id),
  fecha_salida   TIMESTAMP NOT NULL,              -- hora de Perú
  hora_llegada   TIMESTAMP NOT NULL,              -- salida + duración de la ruta
  asiento        INTEGER NOT NULL CHECK (asiento BETWEEN 1 AND 40),
  tipo_asiento   TEXT NOT NULL DEFAULT 'semicama' CHECK (tipo_asiento IN ('semicama', 'cama')),
  equipaje_kg    NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (equipaje_kg BETWEEN 0 AND 100),
  precio         NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
  estado         TEXT NOT NULL DEFAULT 'registrado'
                 CHECK (estado IN ('registrado', 'pagado', 'abordado', 'cancelado')),
  creado         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Un asiento no se vende dos veces en el mismo viaje
CREATE UNIQUE INDEX compras_pasajes_asiento_libre
  ON compras_pasajes (id_ruta, fecha_salida, asiento) WHERE estado <> 'cancelado';

-- ---------- Aeropuerto (Mueras) ----------
CREATE TABLE reservas_estacionamiento (
  id                  SERIAL PRIMARY KEY,
  codigo              TEXT NOT NULL UNIQUE,       -- EST-00001
  id_usuario          INTEGER NOT NULL REFERENCES usuarios (id),
  id_pasaje           INTEGER UNIQUE REFERENCES compras_pasajes (id),  -- enlace con TransAndino
  tipo                TEXT NOT NULL DEFAULT 'auto' CHECK (tipo IN ('auto', 'bus')),
  placa               TEXT NOT NULL CHECK (char_length(placa) = 7 AND placa ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}'),
  nombre_pasajero     TEXT NOT NULL,
  fecha_hora_entrada  TIMESTAMP NOT NULL,         -- hora de Perú
  horas               NUMERIC(5, 1) NOT NULL CHECK (horas > 0 AND horas <= 240),
  zona_vip            BOOLEAN NOT NULL DEFAULT FALSE,
  monto               NUMERIC(10, 2) NOT NULL CHECK (monto >= 0),
  zona                TEXT,                       -- zona asignada por el empleado (buses)
  estado              TEXT NOT NULL DEFAULT 'registrado'
                      CHECK (estado IN ('registrado', 'pagado', 'preparado', 'finalizado', 'cancelado')),
  creado              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Pagos de los dos módulos ----------
CREATE TABLE pagos (
  id                SERIAL PRIMARY KEY,
  codigo_operacion  TEXT NOT NULL UNIQUE,
  entidad           TEXT NOT NULL CHECK (entidad IN ('pasaje', 'reserva')),
  id_entidad        INTEGER NOT NULL,
  id_usuario        INTEGER NOT NULL REFERENCES usuarios (id),
  metodo            TEXT NOT NULL CHECK (metodo IN ('tarjeta', 'billetera', 'efectivo', 'pos')),
  monto             NUMERIC(10, 2) NOT NULL CHECK (monto >= 0),
  id_cajero         INTEGER REFERENCES usuarios (id),   -- NULL = pago en línea
  monto_recibido    NUMERIC(10, 2),                     -- efectivo: lo que entregó el cliente
  vuelto            NUMERIC(10, 2),
  fecha             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entidad, id_entidad)
);

-- ---------- CRM: trazabilidad y seguimiento ----------
-- Cada cambio de estado de un pasaje o una reserva: quién y cuándo (usuario_id NULL = el sistema)
CREATE TABLE estados_historial (
  id          SERIAL PRIMARY KEY,
  entidad     TEXT NOT NULL CHECK (entidad IN ('pasaje', 'reserva')),
  id_entidad  INTEGER NOT NULL,
  estado      TEXT NOT NULL,
  usuario_id  INTEGER REFERENCES usuarios (id),
  nota        TEXT CHECK (char_length(nota) <= 200),
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX estados_historial_entidad ON estados_historial (entidad, id_entidad, fecha);

-- ---------- Caja (ventanilla): apertura con fondo inicial y arqueo al cerrar ----------
CREATE TABLE cajas (
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
-- Un cajero tiene como máximo una caja abierta
CREATE UNIQUE INDEX cajas_una_abierta ON cajas (cajero_id) WHERE estado = 'abierta';

CREATE TABLE notas_cliente (
  id          SERIAL PRIMARY KEY,
  id_cliente  INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  id_autor    INTEGER NOT NULL REFERENCES usuarios (id),
  texto       TEXT NOT NULL CHECK (char_length(texto) BETWEEN 2 AND 500),
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
