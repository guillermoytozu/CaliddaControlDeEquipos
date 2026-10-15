import { useState, useEffect } from "react";
import { supabase } from '../supabase/supabaseClient';
import './TablaMovimientos.css';

export const TablaMovimientos = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Hacemos un JOIN con las tablas relacionadas usando la sintaxis de Supabase
                const { data, error } = await supabase
                    .from('movimientos')
                    .select(`
                        id_movimiento,
                        tipo_movimiento,
                        fecha_hora,
                        persona ( nombre ),
                        inventarioequipos ( tipo_equipo, marca, modelo ),
                        ubicaciones ( ubicacion )
                    `)
                    // Ordenamos para que los movimientos más recientes salgan primero
                    .order('fecha_hora', { ascending: false });

                if (error) throw error;

                setMovimientos(data);
                setCargando(false);
            } catch (err) {
                console.error("Error al cargar los datos de Supabase:", err.message);
                setError(true);
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    return (
        <section id="seccion-lista" className="seccion-tabla-movimientos">
            <div className="tabla-header-area">
                <h2 className="tabla-titulo">Trazabilidad de equipos</h2>
                <p className="tabla-subtitulo">Historial completo de salidas e ingresos de equipos</p>
            </div>

            <div className="tabla-scroll-hint" aria-hidden="true">
                <span>⟷ Desliza horizontalmente para ver más</span>
            </div>

            <div className="tabla-responsive-container">
                <table id="tabla-lista-equipos" className="tabla-datos">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Equipo</th>
                            <th>Ubicación</th>
                            <th>Movimiento</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                        </tr>
                    </thead>
                    <tbody id="cuerpo-tabla-equipos">

                        {cargando && (
                            <tr><td colSpan="6" className="tabla-mensaje-estado">Cargando lista...</td></tr>
                        )}

                        {error && (
                            <tr><td colSpan="6" className="tabla-mensaje-error">Error al cargar la lista.</td></tr>
                        )}

                        {!cargando && !error && movimientos.map((dato) => {
                            // Formateo de fecha y hora a partir del campo fecha_hora de Supabase
                            const fechaObj = new Date(dato.fecha_hora);
                            const fechaYHora = fechaObj.toLocaleString("es-PE", { hour12: false });
                            const fecha = fechaYHora.split(',')[0];
                            const hora = fechaYHora.split(',')[1]?.trim().slice(0, 5) || "";

                            // Construimos el string del equipo concatenando marca y modelo
                            const equipoString = dato.inventarioequipos
                                ? `${dato.inventarioequipos.tipo_equipo} - ${dato.inventarioequipos.marca} ${dato.inventarioequipos.modelo}`
                                : "Equipo no encontrado";

                            const claseMovimiento = dato.tipo_movimiento?.toLowerCase() === 'salida' ? 'salida' : 'ingreso';

                            return (
                                <tr key={dato.id_movimiento}>
                                    <td><strong>{dato.persona?.nombre || "Usuario desconocido"}</strong></td>
                                    <td>{equipoString}</td>
                                    <td>{dato.ubicaciones?.ubicacion || "Ubicación desconocida"}</td>
                                    <td>
                                        <span className={`badge-movimiento ${claseMovimiento}`}>
                                            {dato.tipo_movimiento}
                                        </span>
                                    </td>
                                    <td>{fecha}</td>
                                    <td>{hora}</td>
                                </tr>
                            );
                        })}

                    </tbody>
                </table>
            </div>
        </section>
    );
};