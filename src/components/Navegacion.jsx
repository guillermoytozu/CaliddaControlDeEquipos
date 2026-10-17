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
                    <NavLink id="Link-inicio" to="/registro" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Registro
                    </NavLink>
                </li>
                <li>
                    <NavLink id="Link-trazabilidad" to="/trazabilidad" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Trazabilidad
                    </NavLink>
                </li>
                <li>
                    <NavLink id="Link-inventario" to="/inventario" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Inventario
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};