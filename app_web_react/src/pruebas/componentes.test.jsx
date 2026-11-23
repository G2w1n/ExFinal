// Componentes de React con Testing Library: lo que ve y usa la persona
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '../i18n.js';
import { Estado } from '../components/Estado.jsx';
import { Desglose } from '../components/Desglose.jsx';
import { PasosViaje } from '../components/PasosViaje.jsx';
import { Campo } from '../components/Campo.jsx';
import { RutaProtegida } from '../components/RutaProtegida.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { MapaAsientos } from '../modulos/transandino/MapaAsientos.jsx';

describe('Estado', () => {
  it('traduce "preparado" a "espacio listo" con color verde', () => {
    render(<Estado valor="preparado" />);
    expect(screen.getByText('espacio listo')).toHaveClass('estado-verde');
  });
});

describe('Desglose del precio', () => {
  it('muestra cada línea y el total que calculó el servidor', () => {
    render(<Desglose cotizacion={{ lineas: [{ etiqueta: 'Asiento cama (1.er piso)', valor: 85 }, { etiqueta: 'Exceso de equipaje', valor: 12 }], total: 97 }} />);
    expect(screen.getByText('Asiento cama (1.er piso)')).toBeInTheDocument();
    expect(screen.getByText(/97\.00/)).toBeInTheDocument();
  });
});

describe('Pasos del viaje', () => {
  it('marca el paso actual para lectores de pantalla', () => {
    render(<PasosViaje actual={2} />);
    expect(screen.getByRole('navigation', { name: 'Progreso de tu viaje' })).toBeInTheDocument();
    expect(screen.getByText('Estacionamiento').closest('li')).toHaveAttribute('aria-current', 'step');
  });
});

describe('Campo con error', () => {
  it('anuncia el error y lo enlaza con el campo', () => {
    render(<Campo id="placa" etiqueta="Placa" error="La placa debe tener el formato ABC-123.">{(a) => <input {...a} />}</Campo>);
    const input = screen.getByLabelText('Placa');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('ABC-123');
    expect(input.getAttribute('aria-describedby')).toContain('placa-error');
  });
});

describe('Mapa de asientos', () => {
  it('no deja elegir un asiento ocupado y avisa el elegido', async () => {
    let elegido = null;
    render(<MapaAsientos ocupados={[3]} elegido={null} onElegir={(n) => { elegido = n; }} />);
    expect(screen.getByRole('button', { name: 'Asiento 3, ocupado' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Asiento 15' }));
    expect(elegido).toBe(15);
  });
});

describe('Ruta protegida', () => {
  it('sin sesión lleva al login', () => {
    localStorage.clear();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/app/mis-viajes']}>
          <Routes>
            <Route path="/login" element={<p>Pantalla de login</p>} />
            <Route path="/app/mis-viajes" element={<RutaProtegida><p>Privado</p></RutaProtegida>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });
  it('con sesión pero sin el rol muestra el aviso', () => {
    localStorage.setItem('grupo15.token', 'x');
    localStorage.setItem('grupo15.usuario', JSON.stringify({ id: 1, nombre: 'Ana', roles: { aeropuerto: 'cliente' } }));
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/app/caja']}>
          <Routes><Route path="/app/caja" element={<RutaProtegida personal><p>Caja</p></RutaProtegida>} /></Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes acceso');
  });
});
