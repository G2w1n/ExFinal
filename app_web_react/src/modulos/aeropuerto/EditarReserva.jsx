// src/modulos/aeropuerto/EditarReserva.jsx
// Actualizar del Aeropuerto: solo antes de pagar; la tarifa se recalcula
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mensajeDeError } from '../../api/client.js';
import { reservasApi } from '../../api/servicios.api.js';
import { Carga } from '../../components/Carga.jsx';
import { Pagina } from '../../components/Pagina.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAvisos } from '../../context/AvisosContext.jsx';
import { useCarga } from '../../hooks/useCarga.js';
import { aInputFecha } from '../../utils/formato.js';
import { FormReserva } from './FormReserva.jsx';

export function EditarReserva() {
  const { id } = useParams();
  const { tiene } = useAuth();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const [reserva, setReserva] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { datos: original, error: errorCarga, cargando } = useCarga(async () => {
    const r = await reservasApi.detalle(id);
    setReserva({ placa: r.placa, nombre_pasajero: r.nombre_pasajero, fecha_hora_entrada: aInputFecha(r.fecha_hora_entrada), horas: r.horas, zona_vip: r.zona_vip });
    return r;
  }, [id], { enVivo: false });
  const volver = tiene('aeropuerto', 'administrador', 'empleado') ? '/app/aeropuerto/panel' : '/app/aeropuerto/mis-reservas';

  async function guardar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const r = await reservasApi.editar(id, reserva);
      avisar(`Reserva ${r.codigo} actualizada.`);
      navegar(volver);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pagina modulo="aeropuerto" titulo={original ? `Editar ${original.codigo}` : 'Editar reserva'} intro="Solo se puede editar antes de pagar.">
      <Carga cargando={cargando} error={errorCarga}>
        {original?.estado !== 'registrado'
          ? <p className="caja-error">Esta reserva ya está {original?.estado}: no se puede editar.</p>
          : reserva && (
            <form className="tarjeta formulario" onSubmit={guardar}>
              <FormReserva reserva={reserva} setReserva={setReserva} tipo={original.tipo} sinNombre={original.tipo === 'bus'} />
              {error && <p className="error-campo" role="alert">{error}</p>}
              <div className="acciones">
                <button className="btn btn-aero" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar cambios'}</button>
                <button className="btn btn-borde" type="button" onClick={() => navegar(volver)}>Volver</button>
              </div>
            </form>
          )}
      </Carga>
    </Pagina>
  );
}
