import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './paginaLogin.css';

export const PaginaLogin = () => {

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + "/inicio",
                queryParams: {
                    prompt: 'select_account'
                }
            }
        });

        if (error) console.error('Error iniciando sesión:', error.message);
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error cerrando sesión:', error.message);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {user ? (
                    <div className="profile-info">
                        <h3>Bienvenido, {user.user_metadata?.full_name}</h3>
                        <img src={user.user_metadata?.avatar_url} alt="Avatar" className="avatar-img" />

                        <p>{user.email}</p>

                        <button onClick={() => navigate('/inicio')} className="btn-primary">Ir al Inicio</button>
                        <button onClick={signOut} className="btn-logout">Cerrar Sesión</button>
                    </div>
                ) : (
                    <div className="auth-prompt">
                        <h2>Acceso al Sistema</h2>
                        <p>Por favor, inicia sesión con tu cuenta de Google para continuar.</p>
                        <button onClick={signInWithGoogle} className="btn-google">
                            Iniciar sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};