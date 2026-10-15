import { NavLink } from 'react-router-dom';
import './Navegacion.css';

export const Navegacion = () => {
    return (
        <nav className="navegacion-principal">
            <ul className="lista-Nav">
                <li>
                    <NavLink id="Link-login" to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Login
                    </NavLink>
                </li>
                <li>
                    <NavLink id="Link-inicio" to="/inicio" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Inicio
                    </NavLink>
                </li>
                <li>
                    <NavLink id="Link-fotos" to="/inventario" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Inventario
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};