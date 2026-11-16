// src/crm/Indicadores.jsx
// CRM: indicadores de las dos apps juntas
import { crmApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { soles } from '../utils/formato.js';

export function Indicadores() {
  const { datos: d, error, cargando, recargar } = useCarga(() => crmApi.indicadores(), [], { cadaSegundos: 30 });
  const total = d ? Number(d.ingresos_pasajes) + Number(d.ingresos_estacionamiento) : 0;
  const pct = (n) => (total ? Math.round((Number(n) / total) * 100) : 0);
  return (
    <Pagina modulo="crm" titulo="Indicadores" intro="Resumen del negocio integrado: TransAndino + Aeropuerto.">
      <Carga cargando={cargando} error={error} reintentar={recargar}>
        {d && (
          <>
            <div className="indicadores grandes">
              <div className="indicador"><span>Clientes</span><strong>{d.clientes}</strong></div>
              <div className="indicador"><span>Clientes frecuentes</span><strong>{d.frecuentes}</strong></div>
              <div className="indicador"><span>Viajes integrados (pasaje + estacionamiento)</span><strong>{d.viajes_integrados}</strong></div>
              <div className="indicador"><span>Pendientes de pago</span><strong>{d.pendientes_pago}</strong></div>
            </div>
            <section className="tarjeta">
              <h2>Ingresos por app · {soles(total)}</h2>
              <div className="barras">
                <div className="barra-fila"><span>TransAndino</span><span className="barra-pista"><span className="barra-relleno relleno-ta" style={{ width: `${pct(d.ingresos_pasajes)}%` }} /></span><strong>{soles(d.ingresos_pasajes)}</strong></div>
                <div className="barra-fila"><span>Aeropuerto</span><span className="barra-pista"><span className="barra-relleno relleno-aero" style={{ width: `${pct(d.ingresos_estacionamiento)}%` }} /></span><strong>{soles(d.ingresos_estacionamiento)}</strong></div>
              </div>
            </section>
          </>
        )}
      </Carga>
    </Pagina>
  );
}
