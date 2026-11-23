// src/i18n.js
// Idiomas con i18next: español (base), inglés y quechua (traducción parcial, como en el Parcial).
// Las claves son el texto en español: si falta una traducción, se muestra el español.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const CLAVE = 'grupo15.idioma';
const T = (es, en, qu) => ({ es, en, qu });

// Frases de la interfaz común (menú, barra, portada, login, pasos y mis viajes)
const FRASES = {
  inicio: T('Inicio', 'Home', 'Qallariy'),
  menu: T('Menú', 'Menu', 'Menú'),
  cerrarSesion: T('Cerrar sesión', 'Sign out', 'Lluqsiy'),
  'Iniciar sesión': T('Iniciar sesión', 'Sign in', 'Yaykuy'),
  'Ir a mi cuenta': T('Ir a mi cuenta', 'My account', 'Cuentayman'),
  enVivo: T('En vivo', 'Live', 'Kunan'),
  sinConexion: T('Sin conexión', 'Offline', 'Mana tinkisqa'),
  enVivoSi: T('Conectado en tiempo real', 'Connected in real time', 'Kunanpi tinkisqa'),
  enVivoNo: T('Reconectando…', 'Reconnecting…', 'Kutimuspa…'),
  'rol.cliente': T('cliente', 'customer', 'rantiq'),
  'rol.administrador': T('administrador', 'administrator', 'kamachiq'),
  'rol.empleado': T('empleado', 'staff', 'llamk’aq'),
  // Menú
  'Comprar pasaje': T('Comprar pasaje', 'Buy ticket', 'Pasajeta rantiy'),
  'Mis pasajes': T('Mis pasajes', 'My tickets', 'Pasajeykuna'),
  'Panel de pasajes': T('Panel de pasajes', 'Tickets dashboard', 'Pasajekunaq panelnin'),
  'Venta presencial': T('Venta presencial', 'Counter sale', 'Ventanillapi rantikuy'),
  'Reservar estacionamiento': T('Reservar estacionamiento', 'Book parking', 'Carro sayana waqaychay'),
  'Mis reservas': T('Mis reservas', 'My bookings', 'Waqaychasqaykuna'),
  'Panel de reservas': T('Panel de reservas', 'Bookings dashboard', 'Waqaychasqakunaq panelnin'),
  'Tablero (arrastrar)': T('Tablero (arrastrar)', 'Board (drag)', 'Tablero (aysay)'),
  'Llegadas esperadas': T('Llegadas esperadas', 'Expected arrivals', 'Chayamuqkuna'),
  'Espacio para buses': T('Espacio para buses', 'Bus parking', 'Buskunapaq sayana'),
  'Mi viaje': T('Mi viaje', 'My trip', 'Puriyniy'),
  'Mis viajes': T('Mis viajes', 'My trips', 'Puriyniykuna'),
  Ventanilla: T('Ventanilla', 'Counter', 'Ventanilla'),
  Caja: T('Caja', 'Cashier', 'Qullqi wasi'),
  'Garita de salida': T('Garita de salida', 'Exit gate', 'Lluqsina punku'),
  CRM: T('CRM', 'CRM', 'CRM'),
  Clientes: T('Clientes', 'Customers', 'Rantiqkuna'),
  Indicadores: T('Indicadores', 'Metrics', 'Rikuchiqkuna'),
  // Portada pública
  Vuelos: T('Vuelos', 'Flights', 'Phawaykuna'),
  Estacionamiento: T('Estacionamiento', 'Parking', 'Carro sayana'),
  Rutas: T('Rutas', 'Routes', 'Ñankuna'),
  Servicios: T('Servicios', 'Services', 'Yanapakuykuna'),
  portadaTitulo: T('Tu pasaje y tu estacionamiento, en un solo paso', 'Your bus ticket and parking, in one step', 'Pasajeyki carro sayanaykipas, huk ruwaylla'),
  portadaLede: T('Compra tu pasaje a Cusco y deja reservado el estacionamiento del aeropuerto con la misma cuenta.', 'Buy your ticket to Cusco and book the airport parking with the same account.', 'Qosqoman pasajeykita rantiy, aeropuertopi carro sayanatapas kikin cuentallawan waqaychay.'),
  'Buscar viaje': T('Buscar viaje', 'Find a trip', 'Puriyta maskay'),
  'Fecha de viaje': T('Fecha de viaje', 'Travel date', 'Puriy p’unchaw'),
  Ruta: T('Ruta', 'Route', 'Ñan'),
  'Cómo funciona': T('Cómo funciona', 'How it works', 'Imaynatataq'),
  'Próximos vuelos': T('Próximos vuelos', 'Upcoming flights', 'Hamuq phawaykuna'),
  // Pasos del viaje
  Pasaje: T('Pasaje', 'Ticket', 'Pasaje'),
  Pago: T('Pago', 'Payment', 'Pagay'),
  '¡Listo!': T('¡Listo!', 'Done!', '¡Tukusqa!'),
  // Login
  'Una sola cuenta para TransAndino y el Aeropuerto Cusco.': T('Una sola cuenta para TransAndino y el Aeropuerto Cusco.', 'One account for TransAndino and Cusco Airport.', 'Huk cuentalla TransAndinopaq Qosqo aeropuertopaqpas.'),
  Correo: T('Correo', 'Email', 'Correo'),
  Contraseña: T('Contraseña', 'Password', 'Pakasqa simi'),
  Ingresar: T('Ingresar', 'Sign in', 'Yaykuy'),
  // Mis viajes
  'Tu pasaje de TransAndino y tu estacionamiento del aeropuerto, en un solo lugar. Los estados se actualizan solos.': T('Tu pasaje de TransAndino y tu estacionamiento del aeropuerto, en un solo lugar. Los estados se actualizan solos.', 'Your TransAndino ticket and your airport parking in one place. Statuses update live.', 'TransAndino pasajeyki aeropuerto carro sayanaykipas huk k’itilla. Kunanpi musuqyan.'),
  'Ver en el mapa': T('Ver en el mapa', 'View on map', 'Mapapi qhaway'),
  'Ocultar mapa': T('Ocultar mapa', 'Hide map', 'Mapata pakay'),
  '¡Buen viaje!': T('¡Buen viaje!', 'Have a good trip!', '¡Allin puriy!'),
};

const recursos = { es: { translation: {} }, en: { translation: {} }, qu: { translation: {} } };
Object.entries(FRASES).forEach(([clave, t]) => {
  recursos.es.translation[clave] = t.es;
  recursos.en.translation[clave] = t.en;
  recursos.qu.translation[clave] = t.qu;
});

let inicial = 'es';
try { inicial = localStorage.getItem(CLAVE) || 'es'; } catch { /* sin almacenamiento */ }

i18n.use(initReactI18next).init({
  resources: recursos,
  lng: inicial,
  fallbackLng: 'es',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try { localStorage.setItem(CLAVE, lng); } catch { /* sin almacenamiento */ }
});
document.documentElement.lang = inicial;

export const IDIOMAS = { es: 'Español', en: 'English', qu: 'Runasimi (quechua)' };
export default i18n;
