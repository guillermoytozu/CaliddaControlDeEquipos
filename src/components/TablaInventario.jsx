import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";

export const TablaInventario = () => {
    const [equipos, setEquipos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const obtenerInventario = async () => {
            try {
                const { data, error } = await supabase
                    .from("inventarioequipos")
                    .select("*")
                    .order("id_equipo", { ascending: true });

                if (error) throw error;

                if (data) {
                    setEquipos(data);
                }
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
            <h2>Trazabilidad de equipos</h2>
            <table id="tabla-lista-equipos">
                <thead>
                    <tr>
                        <th>Equipo</th>
                        <th>Disponibilidad</th>
                        <th>Ubicación</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                    </tr>
                </thead>
                <tbody id="cuerpo-tabla-equipos">

                    {cargando ? (
                        <tr>
                            <td colSpan="5" style={{ textAlign: "center" }}>Cargando inventario...</td>
                        </tr>
                    ) : equipos.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ textAlign: "center" }}>No hay equipos registrados</td>
                        </tr>
                    ) : (
                        equipos.map((equipo) => (
                            <tr key={equipo.id_equipo}>
                                {/* Concatenamos el tipo, marca y modelo */}
                                <td> {equipo.marca} {equipo.modelo}</td>

                                {/* Transformamos el valor booleano TRUE/FALSE en texto */}
                                <td>
                                    <span style={{
                                        color: equipo.disponibilidad ? "var(--color-verde)" : "var(--color-rojo)",
                                        fontWeight: "bold"
                                    }}>
                                        {equipo.disponibilidad ? "Disponible" : "Alguien más lo tiene"}
                                    </span>
                                </td>

                                {/* Dejamos estos campos con un guion ya que no vienen de esta tabla específica */}
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                        ))
                    )}

                </tbody>
            </table>
        </section>
    );
}
