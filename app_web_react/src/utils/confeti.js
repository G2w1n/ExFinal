// src/utils/confeti.js
// Lluvia de confeti de 2 segundos al terminar el viaje completo (sin librerías)
import { menosMovimiento } from './movimiento.js';

const COLORES = ['#f2994a', '#1f6b44', '#1c5fa8', '#f5c69b', '#e3004f', '#ffd28c'];

export function lanzarConfeti() {
  if (menosMovimiento()) return;
  const lienzo = document.createElement('canvas');
  lienzo.className = 'confeti';
  lienzo.setAttribute('aria-hidden', 'true');
  lienzo.width = window.innerWidth;
  lienzo.height = window.innerHeight;
  document.body.append(lienzo);
  const ctx = lienzo.getContext('2d');
  const piezas = Array.from({ length: 140 }, () => ({
    x: lienzo.width / 2 + (Math.random() - 0.5) * 200, y: lienzo.height * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
    giro: Math.random() * Math.PI, vg: (Math.random() - 0.5) * 0.3,
    ancho: 6 + Math.random() * 6, alto: 8 + Math.random() * 8, color: COLORES[Math.floor(Math.random() * COLORES.length)],
  }));
  const inicio = performance.now();
  const paso = (t) => {
    const pasado = t - inicio;
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    piezas.forEach((p) => {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.giro += p.vg;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.giro);
      ctx.globalAlpha = Math.max(0, 1 - pasado / 2200);
      ctx.fillStyle = p.color; ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
      ctx.restore();
    });
    if (pasado < 2200) requestAnimationFrame(paso); else lienzo.remove();
  };
  requestAnimationFrame(paso);
}
