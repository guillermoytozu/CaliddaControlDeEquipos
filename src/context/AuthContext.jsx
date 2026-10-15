import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

// 1. Creamos el contexto
const AuthContext = createContext({});

// 2. Creamos el proveedor que envolverá la app
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Para evitar parpadeos al cargar

    useEffect(() => {
        // Obtener sesión actual
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
            setLoading(false);
        });

        // Escuchar cambios
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

// 3. Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
    return useContext(AuthContext);
};