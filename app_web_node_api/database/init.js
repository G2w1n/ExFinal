// database/init.js
// "npm run db:init": crea las tablas (schema.sql) y carga los datos de prueba del grupo.
// BORRA lo que haya en esas tablas: úsalo solo en la base del proyecto.
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { pool, enTransaccion } from '../src/config/db.js';
import { cotizarEstacionamiento, cotizarPasaje, sumarHoras, tipoDeAsiento } from '../src/utils/tarifas.js';
import { codigoDe, codigoOperacion } from '../src/utils/codigos.js';

const CLAVE = '123456';

// Fechas relativas a HOY en Lima, para que siempre haya llegadas "de hoy"
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
const dia = (desplazamiento) => sumarHoras(`${hoy} 00:00:00`, desplazamiento * 24).slice(0, 10);

const PERSONAL = [
  { nombre: 'Administrador Aeropuerto', correo: 'admin@aeropuerto.pe', roles: { aeropuerto: 'administrador', transandino: 'cliente' } },
  { nombre: 'Empleado Aeropuerto', correo: 'empleado1@aeropuerto.pe', roles: { aeropuerto: 'empleado' } },
  { nombre: 'Administrador TransAndino', correo: 'admin@transandino.pe', roles: { transandino: 'administrador', aeropuerto: 'cliente' } },
  { nombre: 'Empleado TransAndino', correo: 'empleado1@transandino.pe', roles: { transandino: 'empleado' } },
];
const NOMBRES = ['Lucía Quispe', 'Marco Huamán', 'Rosa Condori', 'Diego Paredes', 'Ana Mamani',
  'Jorge Salas', 'Carmen Ríos', 'Luis Torres', 'Elena Vargas', 'Pedro Cárdenas'];
const PLACAS = ['ABC-123', 'XYZ-987', 'DEF-555', 'BCD-321', 'CUS-410', 'LMA-202', 'AQP-303', 'ICA-404', 'HYO-505', 'TAC-606'];
const RUTAS = [
  ['Lima', 'Cusco', 19, '20:00'], ['Arequipa', 'Cusco', 10, '21:00'], ['Ica', 'Cusco', 17, '18:00'],
  ['Huancayo', 'Cusco', 18, '19:00'], ['Cusco', 'Lima', 19, '20:00'], ['Ica', 'Lima', 4.5, '08:00'], ['Lima', 'Arequipa', 16, '19:00'],
];

async function main() {
  console.log('Creando tablas…');
  await pool.query(await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  const hash = await bcrypt.hash(CLAVE, 10);

  await enTransaccion(async (db) => {
    const ids = {};
    const usuario = async (u, creado = null) => {
      const { rows } = await db.query(
        `INSERT INTO usuarios (nombre, correo, password_hash, dni, celular, creado) VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW())) RETURNING id`,
        [u.nombre, u.correo, hash, u.dni ?? null, u.celular ?? null, creado]);
      for (const [modulo, rol] of Object.entries(u.roles)) {
        await db.query(`INSERT INTO usuario_rol VALUES ($1, $2, $3)`, [rows[0].id, modulo, rol]);
      }
      ids[u.correo] = rows[0].id;
      return rows[0].id;
    };
    for (const p of PERSONAL) await usuario(p);
    const clientes = [];
    for (let i = 0; i < 10; i++) {
      // El cliente 10 es antiguo e inactivo; el resto se registró hace poco o hace unos meses
      const creado = i === 9 ? `${dia(-200)} 10:00:00-05` : i < 3 ? `${dia(-60)} 10:00:00-05` : null;
      clientes.push(await usuario({
        nombre: NOMBRES[i], correo: `cliente${i + 1}@correo.com`, dni: String(40000001 + i * 1111), celular: `9${String(87654321 - i * 1001).padStart(8, '0')}`,
        roles: { transandino: 'cliente', aeropuerto: 'cliente' },
      }, creado));
    }

    const idRuta = {};
    for (const [origen, destino, horas, salida] of RUTAS) {
      const { rows } = await db.query(`INSERT INTO rutas (origen, destino, duracion_horas, hora_salida) VALUES ($1, $2, $3, $4) RETURNING id`,
        [origen, destino, horas, salida]);
      idRuta[`${origen}-${destino}`] = { id: rows[0].id, horas, salida };
    }

    const empTA = ids['empleado1@transandino.pe'];
    const empAero = ids['empleado1@aeropuerto.pe'];
    const historial = (entidad, id, estado, usuarioId, nota, fecha) => db.query(
      `INSERT INTO estados_historial (entidad, id_entidad, estado, usuario_id, nota, fecha) VALUES ($1, $2, $3, $4, $5, $6)`,
      [entidad, id, estado, usuarioId, nota, fecha]);
    const pagar = (entidad, id, idUsuario, monto, metodo, fecha) => db.query(
      `INSERT INTO pagos (codigo_operacion, entidad, id_entidad, id_usuario, metodo, monto, fecha) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [codigoOperacion(), entidad, id, idUsuario, metodo, monto, fecha]);

    // Pasaje con su historial: registrado → pagado → abordado, según "hasta"
    let nPasaje = 0;
    async function pasaje(idUsuario, ruta, fecha, asiento, hasta, opciones = {}) {
      const r = idRuta[ruta];
      const fechaSalida = `${fecha} ${r.salida}:00`;
      const tipo = tipoDeAsiento(asiento);
      const equipaje = opciones.equipaje ?? (asiento % 4 === 0 ? 25 : 15);
      const precio = cotizarPasaje({ tipo_asiento: tipo, equipaje_kg: equipaje }).total;
      const id = ++nPasaje;
      const creado = `${sumarHoras(fechaSalida, -72)}-05`;
      await db.query(
        `INSERT INTO compras_pasajes (id, codigo, id_usuario, id_ruta, fecha_salida, hora_llegada, asiento, tipo_asiento, equipaje_kg, precio, estado, creado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [id, codigoDe('PAS', id), idUsuario, r.id, fechaSalida, sumarHoras(fechaSalida, r.horas), asiento, tipo, equipaje, precio, hasta, creado]);
      await historial('pasaje', id, 'registrado', idUsuario, 'Compra en línea', creado);
      if (hasta !== 'registrado' && hasta !== 'cancelado') {
        const fechaPago = `${sumarHoras(fechaSalida, -71)}-05`;
        await pagar('pasaje', id, idUsuario, precio, 'tarjeta', fechaPago);
        await historial('pasaje', id, 'pagado', idUsuario, 'Pago con tarjeta', fechaPago);
      }
      if (hasta === 'abordado') await historial('pasaje', id, 'abordado', empTA, 'Pasajero abordó el bus', `${sumarHoras(fechaSalida, -0.2)}-05`);
      if (hasta === 'cancelado') await historial('pasaje', id, 'cancelado', idUsuario, 'Pasaje cancelado', `${sumarHoras(fechaSalida, -48)}-05`);
      return { id, llegada: sumarHoras(fechaSalida, r.horas) };
    }

    let nReserva = 0;
    async function reserva(idUsuario, { idPasaje = null, tipo = 'auto', placa, nombre, entrada, horas, vip = false, hasta, zona = null }) {
      const monto = cotizarEstacionamiento({ horas, fecha_hora_entrada: entrada, tipo, zona_vip: vip }).total;
      const id = ++nReserva;
      const creado = `${sumarHoras(entrada, -60)}-05`;
      await db.query(
        `INSERT INTO reservas_estacionamiento (id, codigo, id_usuario, id_pasaje, tipo, placa, nombre_pasajero, fecha_hora_entrada, horas, zona_vip, monto, zona, estado, creado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [id, codigoDe('EST', id), idUsuario, idPasaje, tipo, placa, nombre, entrada, horas, vip, monto, zona, hasta, creado]);
      await historial('reserva', id, 'registrado', idUsuario, idPasaje ? 'Reserva enlazada a un pasaje' : tipo === 'bus' ? 'Espacio para bus de traslado' : 'Reserva en línea', creado);
      if (['pagado', 'preparado', 'finalizado'].includes(hasta)) {
        const fechaPago = `${sumarHoras(entrada, -59)}-05`;
        await pagar('reserva', id, idUsuario, monto, idPasaje ? 'billetera' : 'tarjeta', fechaPago);
        await historial('reserva', id, 'pagado', idUsuario, 'Pago en línea', fechaPago);
      }
      if (zona) await historial('reserva', id, hasta, empAero, `Zona ${zona} asignada`, `${sumarHoras(entrada, -24)}-05`);
      if (['preparado', 'finalizado'].includes(hasta)) await historial('reserva', id, 'preparado', empAero, 'Espacio preparado', `${sumarHoras(entrada, -1)}-05`);
      if (hasta === 'finalizado') await historial('reserva', id, 'finalizado', empAero, 'El vehículo salió', `${sumarHoras(entrada, horas)}-05`);
      return id;
    }

    const RUTAS_A_CUSCO = ['Lima-Cusco', 'Arequipa-Cusco', 'Ica-Cusco', 'Huancayo-Cusco'];
    for (let i = 0; i < 10; i++) {
      const c = clientes[i];
      const asiento = i + 1;
      if (i < 6) {
        // 1) Pasaje a Cusco que llega HOY (salió ayer) → para "Llegadas esperadas" y "Mis viajes"
        const p = await pasaje(c, RUTAS_A_CUSCO[i % 4], dia(-1), asiento, 'abordado');
        if (i < 5) {
          await reserva(c, {
            idPasaje: p.id, placa: PLACAS[i], nombre: NOMBRES[i], entrada: sumarHoras(p.llegada, 0.5), horas: 8 + i * 4,
            vip: i === 1, hasta: i === 0 ? 'preparado' : i === 4 ? 'registrado' : 'pagado',
          });
        }
      } else {
        // 1) Viaje ya realizado (para el historial del CRM)
        await pasaje(c, 'Ica-Lima', dia(i === 9 ? -120 : -20 - i), asiento, 'abordado');
      }
      // 2) Próximo viaje (el cliente 10 está inactivo: su último viaje fue hace meses)
      if (i === 9) await pasaje(c, 'Cusco-Lima', dia(-170), asiento, 'abordado');
      else await pasaje(c, i % 2 ? 'Cusco-Lima' : 'Lima-Cusco', dia(5 + i), asiento, i % 3 === 0 ? 'registrado' : 'pagado');
      // 3) Reserva de estacionamiento sin pasaje
      if (i !== 9) {
        await reserva(c, {
          placa: PLACAS[i], nombre: NOMBRES[i], entrada: `${dia(3 + i)} ${String(6 + i).padStart(2, '0')}:00:00`, horas: 3 + i,
          hasta: i % 4 === 0 ? 'registrado' : 'pagado',
        });
      } else {
        await pasaje(c, 'Lima-Arequipa', dia(-150), asiento, 'abordado');
      }
    }
    // Cliente frecuente: dos viajes más ya realizados
    await pasaje(clientes[0], 'Ica-Lima', dia(-40), 21, 'abordado');
    await pasaje(clientes[0], 'Lima-Arequipa', dia(-35), 21, 'abordado');
    await pasaje(clientes[2], 'Lima-Cusco', dia(12), 22, 'cancelado');

    // Integración 2: espacios para los buses de TransAndino
    const adminTA = ids['admin@transandino.pe'];
    await reserva(adminTA, { tipo: 'bus', placa: 'T3X-456', nombre: 'TransAndino Perú', entrada: `${hoy} 06:00:00`, horas: 2, hasta: 'pagado', zona: 'B' });
    await reserva(adminTA, { tipo: 'bus', placa: 'T3X-457', nombre: 'TransAndino Perú', entrada: `${dia(1)} 06:00:00`, horas: 2, hasta: 'pagado' });
    await reserva(adminTA, { tipo: 'bus', placa: 'T3X-458', nombre: 'TransAndino Perú', entrada: `${dia(2)} 14:00:00`, horas: 3, hasta: 'registrado' });

    // Notas del CRM
    await db.query(`INSERT INTO notas_cliente (id_cliente, id_autor, texto) VALUES
      ($1, $3, 'Cliente frecuente: ofrecer zona VIP en su próximo viaje.'),
      ($2, $4, 'Pidió asiento cama en el primer piso por un tema de salud.')`,
      [clientes[0], clientes[2], ids['admin@aeropuerto.pe'], empTA]);

    // Las secuencias siguen después de los ids que pusimos a mano
    await db.query(`SELECT setval(pg_get_serial_sequence('compras_pasajes', 'id'), $1)`, [nPasaje]);
    await db.query(`SELECT setval(pg_get_serial_sequence('reservas_estacionamiento', 'id'), $1)`, [nReserva]);
    console.log(`Usuarios: ${4 + 10} · rutas: ${RUTAS.length} · pasajes: ${nPasaje} · reservas: ${nReserva}`);
  });

  console.log(`Listo. Contraseña de todas las cuentas de prueba: ${CLAVE}`);
  await pool.end();
}

main().catch(async (error) => {
  console.error('No se pudo inicializar la base:', error.message);
  await pool.end();
  process.exit(1);
});
