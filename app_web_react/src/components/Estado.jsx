// src/components/Estado.jsx
// Estados con color fijo: gris registrado · ámbar en proceso · verde pagado/listo · rojo cancelado
const COLOR = {
  registrado: 'gris', pendiente: 'gris',
  pagado: 'verde', abordado: 'verde', preparado: 'verde', finalizado: 'azul', reservado: 'verde',
  cancelado: 'rojo',
  frecuente: 'verde', nuevo: 'azul', regular: 'gris', inactivo: 'ambar',
};
const TEXTO = { preparado: 'espacio listo', finalizado: 'salió' };

export const Estado = ({ valor }) => <span className={`estado estado-${COLOR[valor] ?? 'gris'}`}>{TEXTO[valor] ?? valor}</span>;
