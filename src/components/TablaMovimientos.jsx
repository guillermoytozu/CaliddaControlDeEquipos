import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import "./TablaMovimientos.css";

export const TablaMovimientos = () => {
  // Obtenemos la fecha de hoy en formato YYYY-MM-DD
  const hoy = new Date().toISOString().split("T")[0];

  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // Estados para el rango de fechas (por defecto: hoy)
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        // Ajustamos las horas para abarcar el día completo seleccionado
        const inicioRango = `${fechaInicio} 00:00:00`;
        const finRango = `${fechaFin} 23:59:59`;

        const { data, error } = await supabase
          .from("movimientos")
          .select(
            `
                        id_movimiento,
                        tipo_movimiento,
                        fecha_hora,
                        persona ( nombre ),
                        estado,
                        observaciones,
                        inventarioequipos ( tipo_equipo, marca, modelo, numero_serie ),
                        ubicaciones ( ubicacion )
                    `,
          )
          .gte("fecha_hora", inicioRango)
          .lte("fecha_hora", finRango)
          .order("fecha_hora", { ascending: false });

        if (error) throw error;

        setMovimientos(data);
        setCargando(false);
      } catch (err) {
        console.error("Error al cargar los datos de Supabase:", err.message);
        setError(true);
        setCargando(false);
      }
    };

    // Evitar consultas si las fechas están vacías
    if (fechaInicio && fechaFin) {
      cargarDatos();
    }
  }, [fechaInicio, fechaFin]); // El hook se vuelve a ejecutar cada vez que cambian las fechas

  return (
    <section id="seccion-lista" className="seccion-tabla-movimientos">
      <div className="tabla-header-area">
        <div className="tabla-titulos-container">
          <h2 className="tabla-titulo">Trazabilidad de equipos</h2>
          <p className="tabla-subtitulo">
            Historial completo de salidas e ingresos de equipos
          </p>
        </div>

        <div className="tabla-filtros-container">
          <div className="filtro-grupo">
            <label htmlFor="fecha-inicio">Desde:</label>
            <input
              type="date"
              id="fecha-inicio"
              className="input-fecha"
              value={fechaInicio}
              max={hoy}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="filtro-grupo">
            <label htmlFor="fecha-fin">Hasta:</label>
            <input
              type="date"
              id="fecha-fin"
              className="input-fecha"
              value={fechaFin}
              min={fechaInicio}
              max={hoy}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="tabla-responsive-container">
        <table id="tabla-lista-equipos" className="tabla-datos">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Ubicación</th>
              <th>Equipo</th>
              <th>Estado</th>
              <th>Observaciones</th>
              <th>Movimiento</th>
              <th>Fecha</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla-equipos">
            {cargando && (
              <tr>
                <td colSpan="8" className="tabla-mensaje-estado">
                  Cargando movimientos...
                </td>
              </tr>
            )}

            {error && !cargando && (
              <tr>
                <td colSpan="6" className="tabla-mensaje-error">
                  Error al cargar la lista.
                </td>
              </tr>
            )}

            {!cargando && !error && movimientos.length === 0 && (
              <tr>
                <td colSpan="8" className="tabla-mensaje-estado">
                  No se encontraron movimientos en este rango de fechas.
                </td>
              </tr>
            )}

            {!cargando &&
              !error &&
              movimientos.map((dato) => {
                const fechaObj = new Date(dato.fecha_hora);
                const fechaYHora = fechaObj.toLocaleString("es-PE", {
                  hour12: false,
                });
                const fecha = fechaYHora.split(",")[0];
                const hora = fechaYHora.split(",")[1]?.trim().slice(0, 5) || "";

                const equipoString = dato.inventarioequipos
                  ? `${dato.inventarioequipos.tipo_equipo}${dato.inventarioequipos.marca ? ` - ${dato.inventarioequipos.marca}` : ""}${dato.inventarioequipos.modelo ? ` ${dato.inventarioequipos.modelo}` : ""}${dato.inventarioequipos.numero_serie ? ` - NS ${dato.inventarioequipos.numero_serie}` : ""}`
                  : "Equipo no encontrado";

                const claseMovimiento =
                  dato.tipo_movimiento?.toLowerCase() === "salida"
                    ? "salida"
                    : "ingreso";

                return (
                  <tr key={dato.id_movimiento}>
                    <td>
                      <strong>
                        {dato.persona?.nombre || "Usuario desconocido"}
                      </strong>
                    </td>
                    <td>
                      {dato.ubicaciones?.ubicacion || "Ubicación desconocida"}
                    </td>
                    <td>{equipoString}</td>
                    <td>{dato.estado}</td>
                    <td>{dato.observaciones}</td>
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
