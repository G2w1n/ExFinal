// src/components/BusquedaGlobal.jsx
// Paleta de comandos (cmdk) con Ctrl + K: ir a cualquier pantalla del menú, cambiar tema o idioma,
// y (personal) buscar pasajes, reservas y clientes por placa, código o nombre.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useTranslation } from 'react-i18next';
import { crmApi, pasajesApi, reservasApi } from '../api/servicios.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { armarMenu, MODULOS } from '../utils/menu.js';
import { normalizar } from '../utils/texto.js';

export function BusquedaGlobal() {
  const { usuario, tiene, salir } = useAuth();
  const { t, i18n } = useTranslation();
  const navegar = useNavigate();
  const dialogo = useRef(null);
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const ta = tiene('transandino', 'administrador', 'empleado');
  const aero = tiene('aeropuerto', 'administrador', 'empleado');
  const esPersonal = ta || aero;

  useEffect(() => {
    const atajo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!dialogo.current.open) dialogo.current.showModal();
      }
    };
    document.addEventListener('keydown', atajo);
    return () => document.removeEventListener('keydown', atajo);
  }, []);

  useEffect(() => {
    if (!esPersonal || texto.trim().length < 2) { setResultados([]); return undefined; }
    setBuscando(true);
    const temporizador = setTimeout(async () => {
      const [p, r, c] = await Promise.all([
        ta ? pasajesApi.listar({ buscar: texto }).catch(() => []) : [],
        aero ? reservasApi.listar({ buscar: texto }).catch(() => []) : [],
        crmApi.clientes({ buscar: texto }).catch(() => []),
      ]);
      setResultados([
        ...p.slice(0, 4).map((x) => ({ grupo: 'Pasajes', titulo: `${x.codigo} · ${x.origen} → ${x.destino}`, detalle: `${x.cliente} · ${x.estado}`, ruta: `/app/transandino/panel?buscar=${x.codigo}` })),
        ...r.slice(0, 4).map((x) => ({ grupo: 'Reservas', titulo: `${x.codigo} · ${x.placa}`, detalle: `${x.cliente} · ${x.estado}`, ruta: `/app/aeropuerto/panel?buscar=${x.codigo}` })),
        ...c.slice(0, 4).map((x) => ({ grupo: 'Clientes', titulo: x.nombre, detalle: `${x.correo} · ${x.segmento}`, ruta: `/app/crm/clientes/${x.id}` })),
      ]);
      setBuscando(false);
    }, 250);
    return () => clearTimeout(temporizador);
  }, [texto, ta, aero, esPersonal]);

  const cerrar = () => { dialogo.current.close(); setTexto(''); };
  const ir = (ruta) => { cerrar(); navegar(ruta); };
  const coincide = (etiqueta) => !texto.trim() || normalizar(etiqueta).includes(normalizar(texto));

  const pantallas = armarMenu(usuario).flatMap((g) => g.opciones.map(([ruta, nombre]) => ({ ruta, nombre: t(nombre), app: g.titulo ? t(g.titulo) : MODULOS[g.modulo].nombre })))
    .filter((p) => coincide(`${p.nombre} ${p.app}`));
  const acciones = [
    { id: 'tema', nombre: 'Cambiar modo claro / oscuro', hacer: () => document.querySelector('.btn-icono[aria-label="Modo oscuro"]')?.click() },
    ...['es', 'en', 'qu'].filter((l) => l !== i18n.language).map((l) => ({ id: `idioma-${l}`, nombre: `Idioma: ${{ es: 'Español', en: 'English', qu: 'Runasimi' }[l]}`, hacer: () => i18n.changeLanguage(l) })),
    { id: 'salir', nombre: t('cerrarSesion'), hacer: () => { salir(); navegar('/'); } },
  ].filter((a) => coincide(a.nombre));
  const grupos = [...new Set(resultados.map((r) => r.grupo))];

  return (
    <>
      <button type="button" className="btn-buscar" onClick={() => dialogo.current.showModal()} aria-keyshortcuts="Control+K">
        <span aria-hidden="true">⌕</span> {esPersonal ? 'Buscar' : 'Ir a…'} <kbd>Ctrl</kbd><kbd>K</kbd>
      </button>
      <dialog ref={dialogo} className="dialogo dialogo-busqueda" aria-label="Paleta de comandos" onClose={() => setTexto('')}>
        <Command shouldFilter={false} label="Paleta de comandos" className="paleta" loop>
          <Command.Input autoFocus value={texto} onValueChange={setTexto} placeholder={esPersonal ? 'Placa, código (PAS-, EST-), cliente o pantalla…' : 'Escribe una pantalla o una acción…'} />
          <Command.List>
            {buscando && <Command.Loading>Buscando…</Command.Loading>}
            <Command.Empty>Sin resultados.</Command.Empty>
            {grupos.map((g) => (
              <Command.Group key={g} heading={g}>
                {resultados.filter((r) => r.grupo === g).map((r) => (
                  <Command.Item key={r.ruta + r.titulo} value={r.ruta + r.titulo} onSelect={() => ir(r.ruta)}>
                    <strong>{r.titulo}</strong><small>{r.detalle}</small>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
            {pantallas.length > 0 && (
              <Command.Group heading="Ir a">
                {pantallas.map((p) => (
                  <Command.Item key={p.ruta} value={`ir ${p.ruta}`} onSelect={() => ir(p.ruta)}>
                    <strong>{p.nombre}</strong><small>{p.app}</small>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {acciones.length > 0 && (
              <Command.Group heading="Acciones">
                {acciones.map((a) => <Command.Item key={a.id} value={a.id} onSelect={() => { cerrar(); a.hacer(); }}><strong>{a.nombre}</strong></Command.Item>)}
              </Command.Group>
            )}
          </Command.List>
        </Command>
        <p className="nota paleta-ayuda">↑ ↓ para moverte · Enter para abrir · Esc para cerrar</p>
      </dialog>
    </>
  );
}
