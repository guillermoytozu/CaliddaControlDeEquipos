import { createContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

// 1. Creamos el contexto
export const AuthContext = createContext({});

// 2. Creamos el proveedor que envolverá la app
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verificarSesion = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                setUser(session?.user || null);
            } catch (error) {
                console.error("Hubo un error al buscar la sesión:", error.message);
            } finally {
                setLoading(false);
            }
        };

        verificarSesion();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};