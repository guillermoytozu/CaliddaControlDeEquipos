import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RutaPublica = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-loading-screen" role="status" aria-live="polite">
                <div className="auth-loading-spinner" />
                <p className="auth-loading-text">Verificando sesión...</p>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/registro" replace />;
    }

    return children ? children : <Outlet />;
};
