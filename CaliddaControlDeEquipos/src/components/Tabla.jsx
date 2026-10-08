import { useState } from "react";

export const Tabla = ({ children }) => {
    return (
        <>
            <section id="seccion-lista">
                <h2>Trazabilidad de equipos</h2>
                <table id="tabla-lista-equipos">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Equipo</th>
                            <th>Ubicación</th>
                            <th>Movimiento</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                        </tr>
                    </thead>
                    <tbody id="cuerpo-tabla-equipos">
                    </tbody>
                </table>
            </section>

        </>
    );

}
