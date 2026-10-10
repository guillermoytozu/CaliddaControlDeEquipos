import { useState, useEffect } from "react";

export const TablaInventario = () => {
    const [equipos, setEquipos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            const urlAPI = "https://script.google.com/macros/s/AKfycbxxC475VDMbyw74GbWqLYm8x2FIFPi-OuQujPDO59VR9EcIz3LH8ZH52MwKgARGvsJ9/exec";

            try {
                const respuesta = await fetch(urlAPI);
                const datos = await respuesta.json();

                setEquipos(datos);
                setCargando(false);
            } catch (err) {
                console.error("Error al cargar los datos:", err);
                setError(true);
                setCargando(false);
            }
        };

        cargarDatos();
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
                        <th>Fecha</th>
                        <th>Hora</th>
                    </tr>
                </thead>
                <tbody id="cuerpo-tabla-equipos">

                    {cargando && (
                        <tr><td colSpan="7" style={{ textAlign: 'center' }}>Cargando lista...</td></tr>
                    )}

                    {error && (
                        <tr><td colSpan="7" style={{ textAlign: 'center', color: 'red' }}>Error al cargar la lista.</td></tr>
                    )}

                    {!cargando && !error && equipos.map((dato, index) => {

                        const fechaYHora = new Date(dato.date).toLocaleString("es-PE", { hour12: false });
                        const fecha = fechaYHora.split(',')[0];
                        const hora = fechaYHora.split(',')[1].trim().slice(0, 5);

                        return (
                            <tr key={index}>
                                <td>{dato.equipo}</td>
                                <td>{dato.apellido}</td>
                                <td>{dato.ubicacion}</td>
                                <td>{dato.nombre}</td>
                                <td>{dato.apellido}</td>
                                <td>{fecha}</td>
                                <td>{hora}</td>
                            </tr>
                        );
                    })}

                </tbody>
            </table>
        </section>
    );
}
