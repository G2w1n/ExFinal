// src/pages/MiPerfil.jsx
// Mi perfil: datos de la cuenta y foto (guardada en Neon). Sirve para cualquier rol.
import { Pagina } from '../components/Pagina.jsx';
import { SubirFoto } from '../components/SubirFoto.jsx';
import { useFotoPerfil } from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { MODULOS } from '../utils/menu.js';

export function MiPerfil() {
  const { usuario, actualizar } = useAuth();
  const vista = useFotoPerfil(usuario.id, usuario.foto_v);

  return (
    <Pagina modulo="perfil" titulo="Mi perfil" intro="Tu foto se ve en la barra superior y, para el personal, en la ficha del CRM.">
      <div className="perfil-grid">
        <section className="tarjeta">
          <h2>Foto de perfil</h2>
          <SubirFoto tipo="perfil" id={usuario.id} version={usuario.foto_v} vista={vista} etiqueta="foto de perfil"
            onCambio={(v) => actualizar({ foto_v: v })} />
        </section>
        <section className="tarjeta">
          <h2>Mi cuenta</h2>
          <dl className="datos">
            <div className="dato"><dt>Nombre</dt><dd>{usuario.nombre}</dd></div>
            <div className="dato"><dt>Correo</dt><dd>{usuario.correo}</dd></div>
            {Object.entries(usuario.roles ?? {}).map(([m, r]) => (
              <div className="dato" key={m}><dt>{MODULOS[m]?.nombre ?? m}</dt><dd>{r}</dd></div>
            ))}
          </dl>
        </section>
      </div>
    </Pagina>
  );
}
