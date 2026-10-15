import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";

export const TablaInventario = () => {
    const [equipos, setEquipos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const obtenerInventario = async () => {
            try {
                // Consulta optimizada: Traemos directamente la ubicación y la persona actual
                const { data, error } = await supabase
                    .from("inventarioequipos")
                    .select(`
                        id_equipo,
                        tipo_equipo,
                        marca,
                        modelo,
                        disponibilidad,
                        ubicaciones ( ubicacion ),
                        persona ( nombre )
                    `)
                    .order("id_equipo", { ascending: true });

                if (error) throw error;

                if (data) setEquipos(data);

            } catch (error) {
                console.error("Error al obtener los equipos:", error.message);
            } finally {
                setCargando(false);
            }
        };
        obtenerInventario();
    }, []);

    return (
        <section id="seccion-lista">
            <h2>Inventario general</h2>
            <table id="tabla-lista-equipos">
                <thead>
                    <tr>
                        <th>Equipo</th>
                        <th>Disponibilidad</th>
                        <th>Ubicación</th>
                        <th>Usuario actual</th>
                    </tr>
                </thead>
                <tbody id="cuerpo-tabla-equipos">

                    {cargando ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: "center" }}>Cargando inventario...</td>
                        </tr>
                    ) : equipos.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: "center" }}>No hay equipos registrados</td>
                        </tr>
                    ) : (
                        equipos.map((equipo) => {
                            // Si está disponible, mostramos ubicación. Si no, mostramos "-"
                            const nombreUbicacion = equipo.disponibilidad
                                ? (equipo.ubicaciones?.ubicacion || "Sin ubicación asignada")
                                : "-";

                            // Si NO está disponible, mostramos quién lo tiene. Si está almacenado, mostramos "-"
                            const nombreUsuario = !equipo.disponibilidad
                                ? (equipo.persona?.nombre || "Usuario desconocido")
                                : "-";

                            return (
                                <tr key={equipo.id_equipo}>
                                    <td>{equipo.tipo_equipo} - {equipo.marca} {equipo.modelo}</td>

                                    <td>
                                        <span style={{
                                            color: equipo.disponibilidad ? "var(--color-verde)" : "var(--color-rojo)",
                                            fontWeight: "bold"
                                        }}>
                                            {equipo.disponibilidad ? "Disponible" : "En uso"}
                                        </span>
                                    </td>

                                    <td>{nombreUbicacion}</td>
                                    <td>{nombreUsuario}</td>
                                </tr>
                            );
                        })
                    )}

                </tbody>
            </table>
        </section>
    );
};