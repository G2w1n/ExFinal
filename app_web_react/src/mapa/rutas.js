// src/mapa/rutas.js
// Coordenadas aproximadas de las rutas de TransAndino (por las carreteras principales)
// y del Aeropuerto Internacional del Cusco. Funciones puras: se pueden probar.
export const AEROPUERTO = [-13.5357, -71.9388];

const C = {
  Lima: [-12.0464, -77.0428], Pisco: [-13.7103, -76.2035], Ica: [-14.0678, -75.7286], Nazca: [-14.8309, -74.9389],
  Puquio: [-14.6967, -74.1247], Abancay: [-13.6339, -72.8814], Cusco: [-13.5320, -71.9675], Arequipa: [-16.4090, -71.5375],
  Juliaca: [-15.5000, -70.1333], Sicuani: [-14.2694, -71.2261], Huancayo: [-12.0651, -75.2049], Ayacucho: [-13.1588, -74.2232],
  Andahuaylas: [-13.6556, -73.3872], Camana: [-16.6228, -72.7111],
};

const CAMINOS = {
  'Lima-Cusco': ['Lima', 'Pisco', 'Ica', 'Nazca', 'Puquio', 'Abancay', 'Cusco'],
  'Ica-Cusco': ['Ica', 'Nazca', 'Puquio', 'Abancay', 'Cusco'],
  'Arequipa-Cusco': ['Arequipa', 'Juliaca', 'Sicuani', 'Cusco'],
  'Huancayo-Cusco': ['Huancayo', 'Ayacucho', 'Andahuaylas', 'Abancay', 'Cusco'],
  'Ica-Lima': ['Ica', 'Pisco', 'Lima'],
  'Lima-Arequipa': ['Lima', 'Pisco', 'Ica', 'Nazca', 'Camana', 'Arequipa'],
};

// Puntos [lat, lng] del recorrido de origen a destino (o al revés, si la ruta es de vuelta)
export function camino(origen, destino) {
  const ida = CAMINOS[`${origen}-${destino}`];
  if (ida) return ida.map((c) => C[c]);
  const vuelta = CAMINOS[`${destino}-${origen}`];
  if (vuelta) return [...vuelta].reverse().map((c) => C[c]);
  return [C[origen], C[destino]].filter(Boolean);
}

const distancia = (a, b) => Math.hypot(a[0] - b[0], (a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180));

// Punto del recorrido a una fracción (0 a 1) de la distancia total
export function puntoEn(puntos, fraccion) {
  if (puntos.length < 2) return puntos[0];
  const tramos = puntos.slice(1).map((p, i) => distancia(puntos[i], p));
  let falta = Math.max(0, Math.min(1, fraccion)) * tramos.reduce((s, d) => s + d, 0);
  for (let i = 0; i < tramos.length; i++) {
    if (falta <= tramos[i]) {
      const t = tramos[i] ? falta / tramos[i] : 0;
      return [puntos[i][0] + (puntos[i + 1][0] - puntos[i][0]) * t, puntos[i][1] + (puntos[i + 1][1] - puntos[i][1]) * t];
    }
    falta -= tramos[i];
  }
  return puntos[puntos.length - 1];
}

// Avance del viaje (0 a 1) según la hora de Perú; las fechas vienen como "AAAA-MM-DD HH:MM:SS"
const minutos = (texto) => new Date(`${String(texto).slice(0, 16).replace(' ', 'T')}:00Z`).getTime() / 60000;
export function avance(salida, llegada, ahoraTexto) {
  const a = minutos(ahoraTexto);
  return Math.max(0, Math.min(1, (a - minutos(salida)) / (minutos(llegada) - minutos(salida))));
}
