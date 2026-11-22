// src/crm/Indicadores.jsx
// CRM: indicadores de las dos apps juntas, con contadores y un gráfico de ingresos que crece al aparecer
import { useState } from 'react';
import { crmApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { Numero } from '../components/Numero.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { soles } from '../utils/formato.js';

const dia = (texto) => `${texto.slice(8, 10)}/${texto.slice(5, 7)}`;

export function Indicadores() {
  const { datos: d, error, cargando, recargar } = useCarga(() => crmApi.indicadores(), [], { cadaSegundos: 30 });
  const [foco, setFoco] = useState(null);
  const total = d ? Number(d.ingresos_pasajes) + Number(d.ingresos_estacionamiento) : 0;
  const pct = (n) => (total ? Math.round((Number(n) / total) * 100) : 0);
  const max = Math.max(1, ...(d?.serie ?? []).map((x) => Number(x.pasajes) + Number(x.reservas)));

  return (
    <Pagina modulo="crm" titulo="Indicadores" intro="Resumen del negocio integrado: TransAndino + Aeropuerto.">
      <Carga cargando={cargando} error={error} reintentar={recargar}>
        {d && (
          <>
            <div className="indicadores grandes">
              <div className="indicador"><span>Clientes</span><strong><Numero valor={d.clientes} /></strong></div>
              <div className="indicador"><span>Clientes frecuentes</span><strong><Numero valor={d.frecuentes} /></strong></div>
              <div className="indicador"><span>Viajes integrados (pasaje + estacionamiento)</span><strong><Numero valor={d.viajes_integrados} /></strong></div>
              <div className="indicador"><span>Pendientes de pago</span><strong><Numero valor={d.pendientes_pago} /></strong></div>
            </div>
            <section className="tarjeta">
              <div className="cabecera-seccion">
                <h2>Ingresos de los últimos 14 días</h2>
                <ul className="leyenda-grafico"><li><span className="muestra-g ta" /> TransAndino</li><li><span className="muestra-g aero" /> Aeropuerto</li></ul>
              </div>
              <div className="grafico" role="img" aria-label={`Ingresos por día: ${d.serie.map((x) => `${dia(x.dia)} ${soles(Number(x.pasajes) + Number(x.reservas))}`).join(', ')}`}>
                {d.serie.map((x, i) => {
                  const suma = Number(x.pasajes) + Number(x.reservas);
                  return (
                    <div key={x.dia} className={`grafico-col ${foco === i ? 'foco' : ''}`} onMouseEnter={() => setFoco(i)} onMouseLeave={() => setFoco(null)}>
                      {foco === i && <span className="grafico-tip">{dia(x.dia)} · {soles(suma)}<br />TA {soles(x.pasajes)} · Aero {soles(x.reservas)}</span>}
                      <div className="grafico-barra" style={{ height: `${(suma / max) * 100}%`, animationDelay: `${i * 40}ms` }}>
                        <span className="seg-aero" style={{ height: suma ? `${(Number(x.reservas) / suma) * 100}%` : 0 }} />
                        <span className="seg-ta" style={{ height: suma ? `${(Number(x.pasajes) / suma) * 100}%` : 0 }} />
                      </div>
                      <span className="grafico-dia">{dia(x.dia)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="tarjeta">
              <h2>Ingresos por app · <Numero valor={total} formato={soles} /></h2>
              <div className="barras">
                <div className="barra-fila"><span>TransAndino</span><span className="barra-pista"><span className="barra-relleno relleno-ta crecer" style={{ width: `${pct(d.ingresos_pasajes)}%` }} /></span><strong>{soles(d.ingresos_pasajes)}</strong></div>
                <div className="barra-fila"><span>Aeropuerto</span><span className="barra-pista"><span className="barra-relleno relleno-aero crecer" style={{ width: `${pct(d.ingresos_estacionamiento)}%` }} /></span><strong>{soles(d.ingresos_estacionamiento)}</strong></div>
              </div>
            </section>
          </>
        )}
      </Carga>
    </Pagina>
  );
}
