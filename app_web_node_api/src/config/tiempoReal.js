// src/config/tiempoReal.js
// Tiempo real con Socket.IO: cuando cambia un pasaje, una reserva o un cobro, se avisa al instante.
// Salas: "usuario:ID" (sus cosas), "personal:transandino" / "personal:aeropuerto" (su app) y "publico".
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;
const PERSONAL = ['administrador', 'empleado'];

export function iniciarTiempoReal(servidor, origenPermitido) {
  io = new Server(servidor, {
    path: '/api/tiempo-real',
    cors: { origin: (origen, listo) => listo(null, origenPermitido(origen)) },
  });
  io.on('connection', (socket) => {
    socket.join('publico');
    // Con sesión: el token dice quién es y en qué salas entra (sin token solo recibe lo público)
    const token = socket.handshake.auth?.token;
    if (!token) return;
    try {
      const u = jwt.verify(token, process.env.JWT_SECRET);
      socket.join(`usuario:${u.id}`);
      for (const modulo of ['transandino', 'aeropuerto']) {
        if (PERSONAL.includes(u.roles?.[modulo])) socket.join(`personal:${modulo}`);
      }
    } catch {
      socket.emit('sesion-vencida');
    }
  });
  return io;
}

// Solo los datos necesarios: el código y el estado (nada de datos personales en la sala pública)
export function avisarReserva(r, accion = 'actualizada') {
  if (!io || !r) return;
  io.to(`usuario:${r.id_usuario}`).to('personal:aeropuerto')
    .emit('cambio', { entidad: 'reserva', id: r.id, codigo: r.codigo, estado: r.estado, placa: r.placa, accion });
  io.to('publico').emit('cambio-publico', { entidad: 'reserva' });
}

export function avisarPasaje(p, accion = 'actualizado') {
  if (!io || !p) return;
  io.to(`usuario:${p.id_usuario}`).to('personal:transandino')
    .emit('cambio', { entidad: 'pasaje', id: p.id, codigo: p.codigo, estado: p.estado, accion });
  io.to('publico').emit('cambio-publico', { entidad: 'pasaje', id_ruta: p.id_ruta, fecha: String(p.fecha_salida ?? '').slice(0, 10) });
}

export function avisarCobro(modulo, cobro) {
  if (!io) return;
  io.to(`personal:${modulo}`).emit('cambio', { entidad: 'caja', codigo: cobro.codigo, accion: 'cobro' });
}
