// src/pages/Bienvenida.jsx
// Inicio después del login: accesos directos según los roles del usuario
import { Link } from 'react-router-dom';
import { Pagina } from '../components/Pagina.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { armarMenu, MODULOS } from '../utils/menu.js';

export function Bienvenida() {
  const { usuario } = useAuth();
  const grupos = armarMenu(usuario);
  return (
    <Pagina modulo="inicio" titulo={`Hola, ${usuario.nombre.split(' ')[0]}`} intro="Estas son las apps y opciones de tu cuenta.">
      <div className="accesos">
        {grupos.map((g) => (
          <section key={g.modulo} className={`acceso-grupo grupo-${MODULOS[g.modulo]?.color ?? g.modulo}`}>
            <h2>{g.titulo ?? MODULOS[g.modulo].nombre}{g.rol && <span className="rol"> · {g.rol}</span>}</h2>
            <ul>
              {g.opciones.map(([ruta, texto]) => <li key={ruta}><Link to={ruta}>{texto} <span aria-hidden="true">→</span></Link></li>)}
            </ul>
          </section>
        ))}
      </div>
    </Pagina>
  );
}
