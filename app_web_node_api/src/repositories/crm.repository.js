// src/repositories/crm.repository.js
// El CRM ve al cliente completo: pasajes (TransAndino) + reservas (Aeropuerto) + pagos + notas
import { VERSION } from './imagenes.repository.js';
import { pool } from '../config/db.js';

// Resumen por cliente y su tipo: inactivo (sin compras en 90 días), frecuente (3+ viajes pagados),
// nuevo (menos de 30 días) o regular
const RESUMEN = `
  WITH act AS (
    SELECT id_usuario, estado, creado FROM compras_pasajes
    UNION ALL SELECT id_usuario, estado, creado FROM reservas_estacionamiento
  ), stats AS (
    SELECT u.id, u.nombre, u.correo, u.celular, u.creado, ${VERSION('perfil', 'u.id')} AS foto_v,
           (SELECT COUNT(*)::int FROM compras_pasajes p WHERE p.id_usuario = u.id) AS pasajes,
           (SELECT COUNT(*)::int FROM reservas_estacionamiento e WHERE e.id_usuario = u.id) AS reservas,
           (SELECT COUNT(*)::int FROM compras_pasajes p WHERE p.id_usuario = u.id AND p.estado IN ('pagado', 'abordado')) AS viajes,
           (SELECT COUNT(*)::int FROM act a WHERE a.id_usuario = u.id AND a.estado = 'registrado') AS pendientes,
           (SELECT COALESCE(SUM(monto), 0) FROM pagos g WHERE g.id_usuario = u.id) AS gastado,
           (SELECT MAX(creado) FROM act a WHERE a.id_usuario = u.id) AS ultima_actividad
      FROM usuarios u
     WHERE EXISTS (SELECT 1 FROM usuario_rol r WHERE r.id_usuario = u.id AND r.rol = 'cliente')
  )
  SELECT s.*, CASE
           WHEN s.ultima_actividad < NOW() - INTERVAL '90 days' THEN 'inactivo'
           WHEN s.viajes >= 3 THEN 'frecuente'
           WHEN s.creado > NOW() - INTERVAL '30 days' THEN 'nuevo'
           WHEN s.ultima_actividad IS NULL THEN 'inactivo'
           ELSE 'regular' END AS segmento
    FROM stats s`;

export async function clientes({ buscar = '', segmento = '' }) {
  const patron = `%${buscar.replace(/[\\%_]/g, '\\$&')}%`;
  const { rows } = await pool.query(
    `SELECT * FROM (${RESUMEN}) c
      WHERE ($1 = '%%' OR c.nombre ILIKE $1 OR c.correo ILIKE $1)
        AND ($2 = '' OR c.segmento = $2)
      ORDER BY c.gastado DESC, c.nombre LIMIT 200`, [patron, segmento]);
  return rows;
}

export async function cliente(id) {
  const { rows } = await pool.query(`SELECT * FROM (${RESUMEN}) c WHERE c.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function pasajesDe(id) {
  const { rows } = await pool.query(
    `SELECT p.id, p.codigo, p.estado, p.fecha_salida, p.hora_llegada, p.precio, r.origen, r.destino
       FROM compras_pasajes p JOIN rutas r ON r.id = p.id_ruta WHERE p.id_usuario = $1 ORDER BY p.fecha_salida DESC`, [id]);
  return rows;
}

export async function reservasDe(id) {
  const { rows } = await pool.query(
    `SELECT e.id, e.codigo, e.estado, e.tipo, e.placa, e.fecha_hora_entrada, e.monto, p.codigo AS pasaje_codigo
       FROM reservas_estacionamiento e LEFT JOIN compras_pasajes p ON p.id = e.id_pasaje
      WHERE e.id_usuario = $1 ORDER BY e.fecha_hora_entrada DESC`, [id]);
  return rows;
}

// Línea de tiempo: todos los cambios de estado de sus pasajes y reservas, con quién y cuándo
export async function lineaDeTiempo(id) {
  const { rows } = await pool.query(
    `SELECT h.entidad, h.estado, h.nota, h.fecha, a.nombre AS usuario,
            COALESCE(p.codigo, e.codigo) AS codigo
       FROM estados_historial h
       LEFT JOIN compras_pasajes p ON h.entidad = 'pasaje' AND p.id = h.id_entidad
       LEFT JOIN reservas_estacionamiento e ON h.entidad = 'reserva' AND e.id = h.id_entidad
       LEFT JOIN usuarios a ON a.id = h.usuario_id
      WHERE p.id_usuario = $1 OR e.id_usuario = $1
      ORDER BY h.fecha DESC, h.id DESC LIMIT 100`, [id]);
  return rows;
}

export async function notas(id) {
  const { rows } = await pool.query(
    `SELECT n.id, n.texto, n.fecha, a.nombre AS autor FROM notas_cliente n JOIN usuarios a ON a.id = n.id_autor
      WHERE n.id_cliente = $1 ORDER BY n.fecha DESC`, [id]);
  return rows;
}

export async function agregarNota(idCliente, idAutor, texto) {
  const { rows } = await pool.query(
    `INSERT INTO notas_cliente (id_cliente, id_autor, texto) VALUES ($1, $2, $3) RETURNING id, texto, fecha`, [idCliente, idAutor, texto]);
  return rows[0];
}

export async function indicadores() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM (${RESUMEN}) c) AS clientes,
      (SELECT COUNT(*)::int FROM (${RESUMEN}) c WHERE c.segmento = 'frecuente') AS frecuentes,
      (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE entidad = 'pasaje') AS ingresos_pasajes,
      (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE entidad = 'reserva') AS ingresos_estacionamiento,
      (SELECT COUNT(*)::int FROM reservas_estacionamiento WHERE id_pasaje IS NOT NULL AND estado <> 'cancelado') AS viajes_integrados,
      (SELECT COUNT(*)::int FROM compras_pasajes WHERE estado = 'registrado')
        + (SELECT COUNT(*)::int FROM reservas_estacionamiento WHERE estado = 'registrado') AS pendientes_pago`);
  return rows[0];
}

export async function porMetodo() {
  const { rows } = await pool.query(`SELECT metodo, COUNT(*)::int AS operaciones, COALESCE(SUM(monto), 0) AS total FROM pagos GROUP BY metodo ORDER BY total DESC`);
  return rows;
}

// Ingresos de los últimos N días (hora de Perú) por app, para el gráfico de barras
export async function ingresosPorDia(dias = 14) {
  const { rows } = await pool.query(`
    SELECT to_char(d, 'YYYY-MM-DD') AS dia,
           COALESCE(SUM(p.monto) FILTER (WHERE p.entidad = 'pasaje'), 0) AS pasajes,
           COALESCE(SUM(p.monto) FILTER (WHERE p.entidad = 'reserva'), 0) AS reservas
      FROM generate_series((NOW() AT TIME ZONE 'America/Lima')::date - ($1::int - 1), (NOW() AT TIME ZONE 'America/Lima')::date, INTERVAL '1 day') d
      LEFT JOIN pagos p ON (p.fecha AT TIME ZONE 'America/Lima')::date = d::date
     GROUP BY d ORDER BY d`, [dias]);
  return rows;
}

// Notificaciones del personal: llegadas próximas, espacios por preparar, pendientes y últimas compras
export async function notificacionesPersonal({ pasajes, reservas }) {
  const { rows } = await pool.query(`
    WITH ahora AS (SELECT (NOW() AT TIME ZONE 'America/Lima') AS t)
    SELECT 'llegada' AS tipo, p.codigo || ' llega ' || to_char(p.hora_llegada, 'HH24:MI') || ' · ' || e.placa AS texto,
           '/app/aeropuerto/llegadas' AS enlace, p.hora_llegada::text AS orden
      FROM reservas_estacionamiento e JOIN compras_pasajes p ON p.id = e.id_pasaje, ahora a
     WHERE $2 AND e.estado IN ('pagado', 'registrado') AND p.hora_llegada BETWEEN a.t AND a.t + INTERVAL '3 hours'
    UNION ALL
    SELECT 'compra', u.nombre || ' compró ' || cp.codigo, '/app/transandino/panel', cp.creado::text
      FROM compras_pasajes cp JOIN usuarios u ON u.id = cp.id_usuario
     WHERE $1 AND cp.creado BETWEEN NOW() - INTERVAL '6 hours' AND NOW()
    UNION ALL
    SELECT 'reserva', u.nombre || ' reservó ' || e.codigo || ' · ' || e.placa, '/app/aeropuerto/panel', e.creado::text
      FROM reservas_estacionamiento e JOIN usuarios u ON u.id = e.id_usuario
     WHERE $2 AND e.creado BETWEEN NOW() - INTERVAL '6 hours' AND NOW()
    ORDER BY orden DESC LIMIT 12`, [pasajes, reservas]);
  return rows;
}

// Notificaciones del cliente: sus viajes de las próximas 48 horas y sus pendientes de pago
export async function notificacionesCliente(idUsuario) {
  const { rows } = await pool.query(`
    WITH ahora AS (SELECT (NOW() AT TIME ZONE 'America/Lima') AS t)
    SELECT 'viaje' AS tipo, 'Tu bus ' || r.origen || ' → ' || r.destino || ' sale ' || to_char(p.fecha_salida, 'DD/MM HH24:MI') AS texto,
           '/app/mis-viajes' AS enlace, p.fecha_salida::text AS orden
      FROM compras_pasajes p JOIN rutas r ON r.id = p.id_ruta, ahora a
     WHERE p.id_usuario = $1 AND p.estado IN ('pagado', 'registrado') AND p.fecha_salida BETWEEN a.t AND a.t + INTERVAL '48 hours'
    UNION ALL
    SELECT 'espacio', 'Tu espacio ' || e.codigo || ' ya está listo', '/app/mis-viajes', e.fecha_hora_entrada::text
      FROM reservas_estacionamiento e WHERE e.id_usuario = $1 AND e.estado = 'preparado'
    UNION ALL
    SELECT 'pendiente', x.codigo || ' está pendiente de pago', x.enlace, x.fecha::text FROM (
      SELECT codigo, '/app/transandino/mis-pasajes' AS enlace, fecha_salida AS fecha FROM compras_pasajes WHERE id_usuario = $1 AND estado = 'registrado'
      UNION ALL SELECT codigo, '/app/aeropuerto/mis-reservas', fecha_hora_entrada FROM reservas_estacionamiento WHERE id_usuario = $1 AND estado = 'registrado'
    ) x
    ORDER BY orden LIMIT 12`, [idUsuario]);
  return rows;
}
