// src/api/client.js
// Una sola conexión con la API de Node (Render). El token de la sesión viaja en cada petición.
import axios from 'axios';

export const CLAVE_TOKEN = 'grupo15.token';

// Sin VITE_API_URL: en tu PC usa la API local y publicada usa la de Render
const API_PUBLICADA = 'https://exfinal-hd5z.onrender.com/api';
const enMiPC = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (enMiPC ? 'http://localhost:3000/api' : API_PUBLICADA),
  timeout: 60000, // Render gratis puede tardar en despertar
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si la sesión venció, se avisa a la app para que vuelva al login
api.interceptors.response.use((r) => r, (error) => {
  if (error.response?.status === 401 && localStorage.getItem(CLAVE_TOKEN)) {
    window.dispatchEvent(new Event('sesion-vencida'));
  }
  return Promise.reject(error);
});

export function mensajeDeError(error) {
  if (error.code === 'ECONNABORTED' || !error.response) return 'No pudimos conectar con el servidor. Si es la primera visita, espera unos segundos e intenta de nuevo.';
  return error.response.data?.mensaje || 'Ocurrió un error. Intenta de nuevo.';
}
