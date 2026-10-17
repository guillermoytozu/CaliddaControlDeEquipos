import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
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

  // Estados para búsqueda por columna
  const [filtros, setFiltros] = useState({
    usuario: "",
    ubicacion: "",
    equipo: "",
    estado: "",
    observaciones: "",
    movimiento: "",
    fecha: "",
    hora: "",
  });

  // Estado para ordenamiento
  const [orden, setOrden] = useState({ columna: "fecha", direccion: "desc" });

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
              estado_historico,
              observaciones,
              inventarioequipos ( tipo_equipo, marca, modelo, numero_serie ),
              ubicaciones ( ubicacion )
            `,
          )
          .gte("fecha_hora", inicioRango)
          .lte("fecha_hora", finRango)
          .order("fecha_hora", { ascending: false });

        if (error) throw error;

        setMovimientos(data || []);
        setError(false);
      } catch (err) {
        console.error("Error al cargar los datos de Supabase:", err.message);
        setError(true);
      } finally {
        setCargando(false);
      }
    };

    // Evitar consultas si las fechas están vacías
    if (fechaInicio && fechaFin) {
      cargarDatos();
    }
  }, [fechaInicio, fechaFin]);

  // Formateador consistente de fecha y hora
  const parseFechaYHora = (fechaHoraStr) => {
    if (!fechaHoraStr) return { fecha: "", hora: "", timestamp: 0 };
    const d = new Date(fechaHoraStr);
    if (isNaN(d.getTime())) {
      return { fecha: String(fechaHoraStr), hora: "", timestamp: 0 };
    }
    const pad = (n) => String(n).padStart(2, "0");
    const fecha = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { fecha, hora, timestamp: d.getTime() };
  };

  // Mapeo estructurado para visualización, filtrado y exportación
  const datosMapeados = useMemo(() => {
    return movimientos.map((dato) => {
      const { fecha, hora, timestamp } = parseFechaYHora(dato.fecha_hora);
      const usuario = dato.persona?.nombre || "Usuario desconocido";
      const ubicacion = dato.ubicaciones?.ubicacion || "Ubicación desconocida";
      const equipo = dato.inventarioequipos
        ? `${dato.inventarioequipos.tipo_equipo}${dato.inventarioequipos.marca ? ` - ${dato.inventarioequipos.marca}` : ""}${dato.inventarioequipos.modelo ? ` ${dato.inventarioequipos.modelo}` : ""}${dato.inventarioequipos.numero_serie ? ` - NS ${dato.inventarioequipos.numero_serie}` : ""}`
        : "Equipo no encontrado";
      const estado = dato.estado_historico || "";
      const observaciones = dato.observaciones || "";
      const movimiento = dato.tipo_movimiento || "";

      return {
        id: dato.id_movimiento,
        usuario,
        ubicacion,
        equipo,
        estado,
        observaciones,
        movimiento,
        fecha,
        hora,
        timestamp,
      };
    });
  }, [movimientos]);

  // Filtrado por columna (AND, case-insensitive)
  const datosFiltrados = useMemo(() => {
    return datosMapeados.filter((item) => {
      return Object.entries(filtros).every(([columna, valorFiltro]) => {
        if (!valorFiltro || !valorFiltro.trim()) return true;
        const valorItem = String(item[columna] ?? "").toLowerCase();
        const busqueda = valorFiltro.trim().toLowerCase();
        return valorItem.includes(busqueda);
      });
    });
  }, [datosMapeados, filtros]);

  // Comparador respetando tipos de datos (fechas, números, texto)
  const compararValores = (a, b, columna, direccion) => {
    let res;
    if (columna === "fecha") {
      res = (a.timestamp || 0) - (b.timestamp || 0);
    } else if (columna === "hora") {
      res = String(a.hora || "").localeCompare(String(b.hora || ""));
    } else {
      const valA = a[columna] ?? "";
      const valB = b[columna] ?? "";
      const numA = Number(valA);
      const numB = Number(valB);

      if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
        res = numA - numB;
      } else {
        res = String(valA).localeCompare(String(valB), "es", {
          sensitivity: "base",
          numeric: true,
        });
      }
    }
    return direccion === "asc" ? res : -res;
  };

  // Ordenamiento sobre los datos filtrados
  const datosOrdenadosYFiltrados = useMemo(() => {
    if (!orden.columna) return datosFiltrados;
    return [...datosFiltrados].sort((a, b) =>
      compararValores(a, b, orden.columna, orden.direccion),
    );
  }, [datosFiltrados, orden]);

  // Manejo de cambio en filtros
  const handleFiltroChange = (columna, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [columna]: valor,
    }));
  };

  // Manejo de ordenamiento al hacer clic en encabezados
  const handleSort = (columna) => {
    setOrden((prev) => {
      if (prev.columna === columna) {
        return {
          columna,
          direccion: prev.direccion === "asc" ? "desc" : "asc",
        };
      }
      return { columna, direccion: "asc" };
    });
  };

  // Limpiar todos los filtros de columna
  const hayFiltrosActivos = Object.values(filtros).some((v) => v.trim() !== "");
  const limpiarTodosFiltros = () => {
    setFiltros({
      usuario: "",
      ubicacion: "",
      equipo: "",
      estado: "",
      observaciones: "",
      movimiento: "",
      fecha: "",
      hora: "",
    });
  };

  // Exportación a Excel (.xlsx) de los datos visibles
  const exportarAExcel = () => {
    if (datosOrdenadosYFiltrados.length === 0) {
      alert("No hay registros visibles para exportar.");
      return;
    }

    const filasParaExcel = datosOrdenadosYFiltrados.map((item) => ({
      "Usuario": item.usuario,
      "Ubicación": item.ubicacion,
      "Equipo": item.equipo,
      "Estado": item.estado,
      "Observaciones": item.observaciones,
      "Movimiento": item.movimiento,
      "Fecha": item.fecha,
      "Hora": item.hora,
    }));

    const worksheet = XLSX.utils.json_to_sheet(filasParaExcel);

    // Ajuste automático del ancho de columnas
    const encabezados = Object.keys(filasParaExcel[0] || {});
    worksheet["!cols"] = encabezados.map((col) => {
      const maxValLength = filasParaExcel.reduce(
        (max, row) => Math.max(max, String(row[col] ?? "").length),
        col.length,
      );
      return { wch: Math.min(Math.max(maxValLength + 3, 10), 50) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trazabilidad");

    const nombreArchivo = `Trazabilidad_Equipos_${fechaInicio}_al_${fechaFin}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  };

  // Renderizado del icono de ordenamiento
  const renderSortIcon = (columna) => {
    if (orden.columna !== columna) {
      return (
        <span className="sort-icon-neutral" aria-hidden="true">
          ↕
        </span>
      );
    }
    return (
      <span className="sort-icon-active" aria-label={`Orden ${orden.direccion}`}>
        {orden.direccion === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <section id="seccion-lista" className="seccion-tabla-movimientos">
      <div className="tabla-header-area">
        <div className="tabla-titulos-container">
          <h2 className="tabla-titulo">Trazabilidad de equipos</h2>
          <p className="tabla-subtitulo">
            Historial completo de salidas e ingresos de equipos
            {!cargando && !error && (
              <span className="tabla-contador-registros">
                {" "}• Mostrando {datosOrdenadosYFiltrados.length} de {movimientos.length} registros
              </span>
            )}
          </p>
          {hayFiltrosActivos && (
            <button
              type="button"
              className="btn-limpiar-todos-filtros"
              onClick={limpiarTodosFiltros}
            >
              Limpiar filtros de columna
            </button>
          )}
        </div>

        <div className="tabla-acciones-header">
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

          <button
            type="button"
            id="btn-exportar-movimientos"
            className="btn-exportar-excel"
            onClick={exportarAExcel}
            disabled={cargando || datosOrdenadosYFiltrados.length === 0}
            title="Descargar datos visibles en formato Excel (.xlsx)"
          >
            <svg
              className="excel-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16h-8v-2h8v2zm0-4h-8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            <span>Exportar a Excel</span>
          </button>
        </div>
      </div>

      <div className="tabla-responsive-container">
        <table id="tabla-lista-equipos" className="tabla-datos">
          <thead>
            {/* Fila 1: Encabezados con ordenamiento */}
            <tr>
              <th
                className="th-ordenable col-usuario"
                onClick={() => handleSort("usuario")}
                title="Clic para ordenar por Usuario"
              >
                <div className="th-content">
                  <span>Usuario</span>
                  {renderSortIcon("usuario")}
                </div>
              </th>
              <th
                className="th-ordenable col-ubicacion"
                onClick={() => handleSort("ubicacion")}
                title="Clic para ordenar por Ubicación"
              >
                <div className="th-content">
                  <span>Ubicación</span>
                  {renderSortIcon("ubicacion")}
                </div>
              </th>
              <th
                className="th-ordenable col-equipo"
                onClick={() => handleSort("equipo")}
                title="Clic para ordenar por Equipo"
              >
                <div className="th-content">
                  <span>Equipo</span>
                  {renderSortIcon("equipo")}
                </div>
              </th>
              <th
                className="th-ordenable col-estado"
                onClick={() => handleSort("estado")}
                title="Clic para ordenar por Estado"
              >
                <div className="th-content">
                  <span>Estado</span>
                  {renderSortIcon("estado")}
                </div>
              </th>
              <th
                className="th-ordenable col-observaciones"
                onClick={() => handleSort("observaciones")}
                title="Clic para ordenar por Observaciones"
              >
                <div className="th-content">
                  <span>Observaciones</span>
                  {renderSortIcon("observaciones")}
                </div>
              </th>
              <th
                className="th-ordenable col-movimiento"
                onClick={() => handleSort("movimiento")}
                title="Clic para ordenar por Movimiento"
              >
                <div className="th-content">
                  <span>Movimiento</span>
                  {renderSortIcon("movimiento")}
                </div>
              </th>
              <th
                className="th-ordenable col-fecha"
                onClick={() => handleSort("fecha")}
                title="Clic para ordenar por Fecha"
              >
                <div className="th-content">
                  <span>Fecha</span>
                  {renderSortIcon("fecha")}
                </div>
              </th>
              <th
                className="th-ordenable col-hora"
                onClick={() => handleSort("hora")}
                title="Clic para ordenar por Hora"
              >
                <div className="th-content">
                  <span>Hora</span>
                  {renderSortIcon("hora")}
                </div>
              </th>
            </tr>

            {/* Fila 2: Inputs de búsqueda por columna */}
            <tr className="fila-filtros-columnas">
              <th>
                <div className="filtro-input-wrapper">
                  <input
                    type="text"
                    className="input-filtro-columna"
                    placeholder="Buscar..."
                    value={filtros.usuario}
                    onChange={(e) => handleFiltroChange("usuario", e.target.value)}
                    aria-label="Filtrar por Usuario"
                  />
                  {filtros.usuario && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("usuario", "")}
                      title="Borrar filtro"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th>
                <div className="filtro-input-wrapper">
                  <input
                    type="text"
                    className="input-filtro-columna"
                    placeholder="Buscar..."
                    value={filtros.ubicacion}
                    onChange={(e) => handleFiltroChange("ubicacion", e.target.value)}
                    aria-label="Filtrar por Ubicación"
                  />
                  {filtros.ubicacion && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("ubicacion", "")}
                      title="Borrar filtro"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th>
                <div className="filtro-input-wrapper">
                  <input
                    type="text"
                    className="input-filtro-columna"
                    placeholder="Buscar..."
                    value={filtros.equipo}
                    onChange={(e) => handleFiltroChange("equipo", e.target.value)}
                    aria-label="Filtrar por Equipo"
                  />
                  {filtros.equipo && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("equipo", "")}
                      title="Borrar filtro"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th>
                <div className="filtro-input-wrapper">
                  <input
                    type="text"
                    className="input-filtro-columna"
                    placeholder="Buscar..."
                    value={filtros.estado}
                    onChange={(e) => handleFiltroChange("estado", e.target.value)}
                    aria-label="Filtrar por Estado"
                  />
                  {filtros.estado && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("estado", "")}
                      title="Borrar filtro"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th>
                <div className="filtro-input-wrapper">
                  <input
                    type="text"
                    className="input-filtro-columna"
                    placeholder="Buscar..."
                    value={filtros.observaciones}
                    onChange={(e) =>
                      handleFiltroChange("observaciones", e.target.value)
                    }
                    aria-label="Filtrar por Observaciones"
                  />
                  {filtros.observaciones && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("observaciones", "")}
                      title="Borrar filtro"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th>
                <div className="filtro-input-wrapper">
                  <input
                    type="text"
                    className="input-filtro-columna"
                    placeholder="Buscar..."
                    value={filtros.movimiento}
                    onChange={(e) =>
                      handleFiltroChange("movimiento", e.target.value)
                    }
                    aria-label="Filtrar por Movimiento"
                  />
                  {filtros.movimiento && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("movimiento", "")}
                      title="Borrar filtro"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th>
                <div className="filtro-input-wrapper">
                  <input
                    type="text"
                    className="input-filtro-columna"
                    placeholder="Buscar..."
                    value={filtros.fecha}
                    onChange={(e) => handleFiltroChange("fecha", e.target.value)}
                    aria-label="Filtrar por Fecha"
                  />
                  {filtros.fecha && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("fecha", "")}
                      title="Borrar filtro"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
              <th>
                <div className="filtro-input-wrapper">
                  <input
                    type="text"
                    className="input-filtro-columna"
                    placeholder="Buscar..."
                    value={filtros.hora}
                    onChange={(e) => handleFiltroChange("hora", e.target.value)}
                    aria-label="Filtrar por Hora"
                  />
                  {filtros.hora && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("hora", "")}
                      title="Borrar filtro"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
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
                <td colSpan="8" className="tabla-mensaje-error">
                  Error al cargar la lista.
                </td>
              </tr>
            )}

            {!cargando && !error && datosOrdenadosYFiltrados.length === 0 && (
              <tr>
                <td colSpan="8" className="tabla-mensaje-estado">
                  {movimientos.length === 0
                    ? "No se encontraron movimientos en este rango de fechas."
                    : "No se encontraron movimientos que coincidan con los filtros aplicados."}
                </td>
              </tr>
            )}

            {!cargando &&
              !error &&
              datosOrdenadosYFiltrados.map((item) => {
                const claseMovimiento =
                  item.movimiento?.toLowerCase() === "salida"
                    ? "salida"
                    : "ingreso";

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.usuario}</strong>
                    </td>
                    <td>{item.ubicacion}</td>
                    <td>{item.equipo}</td>
                    <td>{item.estado}</td>
                    <td>{item.observaciones}</td>
                    <td>
                      <span className={`badge-movimiento ${claseMovimiento}`}>
                        {item.movimiento}
                      </span>
                    </td>
                    <td>{item.fecha}</td>
                    <td>{item.hora}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
