/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../supabase/supabaseClient';

// 1. Creamos el contexto con valores por defecto
export const AuthContext = createContext({
    user: null,
    session: null,
    loading: true,
    signInWithGoogle: async () => {},
    signOut: async () => {}
});

// 2. Proveedor centralizado de autenticación
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const verificarSesion = async () => {
            try {
                const { data: { session: sesionActual }, error } = await supabase.auth.getSession();
                if (error) throw error;
                if (isMounted) {
                    setSession(sesionActual || null);
                    setUser(sesionActual?.user || null);
                }
            } catch (error) {
                console.error("Hubo un error al buscar la sesión:", error.message);
                if (isMounted) {
                    setSession(null);
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        verificarSesion();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
            if (isMounted) {
                setSession(nuevaSesion || null);
                setUser(nuevaSesion?.user || null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Iniciar sesión con Google OAuth
    const signInWithGoogle = useCallback(async () => {
        try {
            const redirectUrl = window.location.origin + import.meta.env.BASE_URL;
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        prompt: 'select_account'
                    }
                }
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error al iniciar sesión con Google:', error.message);
            return { data: null, error };
        }
    }, []);

    // Cerrar sesión
    const signOut = useCallback(async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
            setSession(null);
            return { error: null };
        } catch (error) {
            console.error('Error cerrando sesión:', error.message);
            return { error };
        }
    }, []);

    // Memoizamos el objeto entregado al Provider para garantizar estabilidad referencial
    const authValue = useMemo(() => ({
        user,
        session,
        loading,
        signInWithGoogle,
        signOut
    }), [user, session, loading, signInWithGoogle, signOut]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para consumir el contexto de autenticación
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
    }
    return context;
};