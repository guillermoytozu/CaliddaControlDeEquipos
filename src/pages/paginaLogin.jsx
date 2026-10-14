import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient'
import { useNavigate } from 'react-router-dom';
import './paginaLogin.css'

export const PaginaLogin = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Obtener la sesión actual al cargar
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
        });

        // Escuchar cambios (login / logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + "/inicio"
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
                        <button onClick={() => navigate('/inicio')} className="btn-primary">Ir al Sistema</button>
                        <button onClick={signOut} className="btn-logout">Cerrar Sesión</button>
                    </div>
                ) : (
                    <div className="auth-prompt">
                        <h2>Acceso al Sistema</h2>
                        <p>Por favor, inicia sesión con tu cuenta de google para continuar.</p>
                        <button onClick={signInWithGoogle} className="btn-google">

                            Iniciar sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};