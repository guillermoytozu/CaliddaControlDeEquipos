import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navegacion.css';

export const Navegacion = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [cerrandoSesion, setCerrandoSesion] = useState(false);

    if (!user) {
        return null;
    }

    const handleCerrarSesion = async () => {
        try {
            setCerrandoSesion(true);
            const { error } = await signOut();
            if (error) {
                alert(`Error al cerrar sesión: ${error.message || error}`);
            } else {
                navigate('/login', { replace: true });
            }
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        } finally {
            setCerrandoSesion(false);
        }
    };

    return (
        <nav className="navegacion-principal" aria-label="Navegación principal">
            <div className="navegacion-contenedor">
                <ul className="lista-Nav">
                    <li>
                        <NavLink
                            id="Link-inicio"
                            to="/registro"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            Registro
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            id="Link-trazabilidad"
                            to="/trazabilidad"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            Trazabilidad
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            id="Link-inventario"
                            to="/inventario"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            Inventario
                        </NavLink>
                    </li>
                </ul>

                <div className="nav-usuario-area">
                    {user.user_metadata?.avatar_url && (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Avatar"
                            className="nav-user-avatar"
                        />
                    )}
                    {user.user_metadata?.full_name && (
                        <span className="nav-user-name" title={user.email}>
                            {user.user_metadata.full_name}
                        </span>
                    )}
                    <button
                        type="button"
                        id="btn-cerrar-sesion"
                        onClick={handleCerrarSesion}
                        disabled={cerrandoSesion}
                        className="btn-cerrar-sesion"
                        title="Cerrar sesión"
                    >
                        <svg
                            className="icon-logout"
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>{cerrandoSesion ? 'Cerrando...' : 'Cerrar sesión'}</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};