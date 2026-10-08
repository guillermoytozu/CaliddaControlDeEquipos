import { Link } from 'react-router-dom';

export const Navegacion = () => {
    return (
        <nav>
            <ul className="lista-Nav">
                {/* Cambiamos <a> por <Link> y href por to */}
                <li><Link id="Link-inicio" to="/inicio">Inicio</Link></li>
                <li><Link id="Link-fotos" to="/inventario">Inventario</Link></li>
            </ul>
        </nav>
    );
}