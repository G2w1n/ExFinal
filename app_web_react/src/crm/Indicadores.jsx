// src/crm/Indicadores.jsx
// CRM: indicadores de las dos apps juntas con gráficos de Recharts (animados, con tooltip y leyenda)
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { crmApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { Numero } from '../components/Numero.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { soles } from '../utils/formato.js';

const COLORES = { ta: '#1f6b44', aero: '#1c5fa8' };
const METODOS = { tarjeta: 'Tarjeta', billetera: 'Billetera', efectivo: 'Efectivo', pos: 'POS' };
const COLORES_METODO = ['#1c5fa8', '#f2994a', '#1f6b44', '#8a4b12'];
const dia = (texto) => `${texto.slice(8, 10)}/${texto.slice(5, 7)}`;

function Globo({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + Number(p.value), 0);
  return (
    <div className="globo-grafico">
      <strong>{label}</strong>
      {payload.map((p) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {soles(p.value)}</p>)}
      {payload.length > 1 && <p>Total: {soles(total)}</p>}
    </div>
  );
}

export function Indicadores() {
  const { datos: d, error, cargando, recargar } = useCarga(() => crmApi.indicadores(), [], { cadaSegundos: 60 });
  const total = d ? Number(d.ingresos_pasajes) + Number(d.ingresos_estacionamiento) : 0;
  const serie = (d?.serie ?? []).map((x) => ({ dia: dia(x.dia), TransAndino: Number(x.pasajes), Aeropuerto: Number(x.reservas) }));
  const metodos = (d?.por_metodo ?? []).map((m) => ({ nombre: METODOS[m.metodo] ?? m.metodo, total: Number(m.total), operaciones: m.operaciones }));
  const porApp = [{ nombre: 'TransAndino', total: Number(d?.ingresos_pasajes ?? 0) }, { nombre: 'Aeropuerto', total: Number(d?.ingresos_estacionamiento ?? 0) }];

  return (
    <Pagina modulo="crm" titulo="Indicadores" intro="Resumen del negocio integrado: TransAndino + Aeropuerto. Se actualiza en vivo.">
      <Carga cargando={cargando} error={error} reintentar={recargar}>
        {d && (
          <>
            <div className="indicadores grandes">
              <div className="indicador"><span>Ingresos totales</span><strong><Numero valor={total} formato={soles} /></strong></div>
              <div className="indicador"><span>Clientes</span><strong><Numero valor={d.clientes} /></strong></div>
              <div className="indicador"><span>Clientes frecuentes</span><strong><Numero valor={d.frecuentes} /></strong></div>
              <div className="indicador"><span>Viajes integrados</span><strong><Numero valor={d.viajes_integrados} /></strong></div>
              <div className="indicador"><span>Pendientes de pago</span><strong><Numero valor={d.pendientes_pago} /></strong></div>
            </div>

            <section className="tarjeta">
              <h2>Ingresos de los últimos 14 días</h2>
              <div className="grafico-recharts" role="img" aria-label={`Ingresos por día: ${serie.map((x) => `${x.dia} ${soles(x.TransAndino + x.Aeropuerto)}`).join(', ')}`}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--linea)" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12, fill: 'var(--tinta-suave)' }} />
                    <YAxis tickFormatter={(v) => `S/ ${v}`} tick={{ fontSize: 12, fill: 'var(--tinta-suave)' }} width={64} />
                    <Tooltip content={<Globo />} cursor={{ fill: 'rgba(28, 95, 168, 0.08)' }} />
                    <Legend />
                    <Bar dataKey="TransAndino" stackId="a" fill={COLORES.ta} animationDuration={900} />
                    <Bar dataKey="Aeropuerto" stackId="a" fill={COLORES.aero} radius={[6, 6, 0, 0]} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="rejilla-2">
              <section className="tarjeta">
                <h2>Ingresos por app</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={porApp} dataKey="total" nameKey="nombre" innerRadius={60} outerRadius={95} paddingAngle={3} animationDuration={900}>
                      <Cell fill={COLORES.ta} /><Cell fill={COLORES.aero} />
                    </Pie>
                    <Tooltip formatter={(v) => soles(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </section>
              <section className="tarjeta">
                <h2>Medios de pago</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={metodos} dataKey="total" nameKey="nombre" outerRadius={95} animationDuration={900} label={({ nombre, percent }) => `${nombre} ${Math.round(percent * 100)} %`}>
                      {metodos.map((m, i) => <Cell key={m.nombre} fill={COLORES_METODO[i % COLORES_METODO.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, _n, item) => [`${soles(v)} · ${item.payload.operaciones} pagos`, item.payload.nombre]} />
                  </PieChart>
                </ResponsiveContainer>
              </section>
            </div>
          </>
        )}
      </Carga>
    </Pagina>
  );
}
