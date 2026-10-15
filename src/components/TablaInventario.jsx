import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import './TablaInventario.css';

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
        <section id="seccion-lista" className="seccion-tabla-inventario">
            <div className="tabla-header-area">
                <h2 className="tabla-titulo">Inventario General</h2>
                <p className="tabla-subtitulo">Estado y asignación de todos los equipos registrados</p>
            </div>

            <div className="tabla-scroll-hint" aria-hidden="true">
                <span>⟷ Desliza horizontalmente para ver más</span>
            </div>

            <div className="tabla-responsive-container">
                <table id="tabla-lista-equipos" className="tabla-datos">
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
                                <td colSpan="4" className="tabla-mensaje-estado">Cargando inventario...</td>
                            </tr>
                        ) : equipos.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="tabla-mensaje-estado">No hay equipos registrados</td>
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

                                const estaDisponible = equipo.disponibilidad;

                                return (
                                    <tr key={equipo.id_equipo}>
                                        <td><strong>{equipo.tipo_equipo}</strong> - {equipo.marca} {equipo.modelo}</td>

                                        <td>
                                            <span className={`badge-disponibilidad ${estaDisponible ? 'disponible' : 'en-uso'}`}>
                                                <span className="badge-dot" aria-hidden="true"></span>
                                                {estaDisponible ? "Disponible" : "En uso"}
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
            </div>
        </section>
    );
};