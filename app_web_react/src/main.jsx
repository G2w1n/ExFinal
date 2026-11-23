import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { AvisosProvider } from './context/AvisosContext.jsx';
import { TiempoRealProvider } from './context/TiempoReal.jsx';
import './i18n.js';
import App from './App.jsx';
import 'leaflet/dist/leaflet.css';
import './styles/index.css';

// Caché de datos: 15 s "frescos"; un error 4xx no se reintenta (la respuesta no va a cambiar)
const consultas = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15000,
      refetchOnWindowFocus: true,
      retry: (intentos, error) => intentos < 1 && !(error?.response?.status < 500),
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={consultas}>
      <BrowserRouter>
        <AvisosProvider>
          <AuthProvider>
            <TiempoRealProvider>
              <App />
            </TiempoRealProvider>
          </AuthProvider>
        </AvisosProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
