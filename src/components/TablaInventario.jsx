import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../supabase/supabaseClient";
import "./TablaInventario.css";

export const TablaInventario = () => {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para filtros por columna
  const [filtros, setFiltros] = useState({
    equipo: "",
    estado: "",
    detalle: "",
    disponibilidad: "",
    ubicacion: "",
    usuarioActual: "",
  });

  // Estado para ordenamiento
  const [orden, setOrden] = useState({ columna: "equipo", direccion: "asc" });

  useEffect(() => {
    const obtenerInventario = async () => {
      try {
        const { data, error } = await supabase
          .from("inventarioequipos")
          .select(
            `
              id_equipo,
              tipo_equipo,
              marca,
              modelo,
              numero_serie,
              estado,
              detalle_equipo,
              disponibilidad,
              ubicaciones ( ubicacion ),
              persona ( nombre )
            `,
          )
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

  // Mapeo estructurado para visualización, filtrado y exportación
  const datosMapeados = useMemo(() => {
    return equipos.map((equipo) => {
      const numeroSerie = equipo.numero_serie
        ? ` - NS ${equipo.numero_serie}`
        : "";
      const equipoCompleto =
        `${equipo.tipo_equipo || ""} - ${equipo.marca || ""} ${equipo.modelo || ""}${numeroSerie}`.trim();
      const estado = equipo.estado || "";
      const detalle = equipo.detalle_equipo || "";
      const estaDisponible = Boolean(equipo.disponibilidad);
      const disponibilidad = estaDisponible ? "Disponible" : "En uso";
      const ubicacion = estaDisponible
        ? equipo.ubicaciones?.ubicacion || "Sin ubicación asignada"
        : "-";
      const usuarioActual = !estaDisponible
        ? equipo.persona?.nombre || "Usuario desconocido"
        : "-";

      return {
        id: equipo.id_equipo,
        raw: equipo,
        equipo: equipoCompleto,
        estado,
        detalle,
        disponibilidad,
        estaDisponible,
        ubicacion,
        usuarioActual,
      };
    });
  }, [equipos]);

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

  // Comparador respetando tipos de datos
  const compararValores = (a, b, columna, direccion) => {
    let res;
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
      equipo: "",
      estado: "",
      detalle: "",
      disponibilidad: "",
      ubicacion: "",
      usuarioActual: "",
    });
  };

  // Exportación a Excel (.xlsx) de los datos visibles
  const exportarAExcel = () => {
    if (datosOrdenadosYFiltrados.length === 0) {
      alert("No hay equipos visibles para exportar.");
      return;
    }

    const filasParaExcel = datosOrdenadosYFiltrados.map((item) => ({
      Equipo: item.equipo,
      Estado: item.estado,
      Detalle: item.detalle,
      Disponibilidad: item.disponibilidad,
      Ubicación: item.ubicacion,
      "Usuario actual": item.usuarioActual,
    }));

    const worksheet = XLSX.utils.json_to_sheet(filasParaExcel);

    // Ajuste automático del ancho de columnas
    const encabezados = Object.keys(filasParaExcel[0] || {});
    worksheet["!cols"] = encabezados.map((col) => {
      const maxValLength = filasParaExcel.reduce(
        (max, row) => Math.max(max, String(row[col] ?? "").length),
        col.length,
      );
      return { wch: Math.min(Math.max(maxValLength + 3, 12), 50) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

    const hoy = new Date().toISOString().split("T")[0];
    const nombreArchivo = `Inventario_General_${hoy}.xlsx`;
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
      <span
        className="sort-icon-active"
        aria-label={`Orden ${orden.direccion}`}
      >
        {orden.direccion === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <section id="seccion-lista" className="seccion-tabla-inventario">
      <div className="tabla-header-area1">
        <div className="tabla-titulos-container">
          <h2 className="tabla-titulo">Inventario General</h2>
          <p className="tabla-subtitulo">
            {!cargando && (
              <span className="tabla-contador-registros">
                {" "}
                Mostrando {datosOrdenadosYFiltrados.length} de {equipos.length}{" "}
                equipos
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
          <button
            type="button"
            id="btn-exportar-inventario"
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
            <span>Excel</span>
          </button>
        </div>
      </div>

      <div className="tabla-responsive-container">
        <table id="tabla-lista-equipos" className="tabla-datos">
          <thead>
            {/* Fila 1: Encabezados con ordenamiento */}
            <tr>
              <th
                className="th-ordenable col-inv-equipo"
                onClick={() => handleSort("equipo")}
                title="Clic para ordenar por Equipo"
              >
                <div className="th-content">
                  <span>Equipo</span>
                  {renderSortIcon("equipo")}
                </div>
              </th>
              <th
                className="th-ordenable col-inv-estado"
                onClick={() => handleSort("estado")}
                title="Clic para ordenar por Estado"
              >
                <div className="th-content">
                  <span>Estado</span>
                  {renderSortIcon("estado")}
                </div>
              </th>
              <th
                className="th-ordenable col-inv-detalle"
                onClick={() => handleSort("detalle")}
                title="Clic para ordenar por Detalle"
              >
                <div className="th-content">
                  <span>Detalle</span>
                  {renderSortIcon("detalle")}
                </div>
              </th>
              <th
                className="th-ordenable col-inv-disponibilidad"
                onClick={() => handleSort("disponibilidad")}
                title="Clic para ordenar por Disponibilidad"
              >
                <div className="th-content">
                  <span>Disponibilidad</span>
                  {renderSortIcon("disponibilidad")}
                </div>
              </th>
              <th
                className="th-ordenable col-inv-ubicacion"
                onClick={() => handleSort("ubicacion")}
                title="Clic para ordenar por Ubicación"
              >
                <div className="th-content">
                  <span>Ubicación</span>
                  {renderSortIcon("ubicacion")}
                </div>
              </th>
              <th
                className="th-ordenable col-inv-usuario"
                onClick={() => handleSort("usuarioActual")}
                title="Clic para ordenar por Usuario actual"
              >
                <div className="th-content">
                  <span>Usuario actual</span>
                  {renderSortIcon("usuarioActual")}
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
                    value={filtros.equipo}
                    onChange={(e) =>
                      handleFiltroChange("equipo", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleFiltroChange("estado", e.target.value)
                    }
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
                    value={filtros.detalle}
                    onChange={(e) =>
                      handleFiltroChange("detalle", e.target.value)
                    }
                    aria-label="Filtrar por Detalle"
                  />
                  {filtros.detalle && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("detalle", "")}
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
                    value={filtros.disponibilidad}
                    onChange={(e) =>
                      handleFiltroChange("disponibilidad", e.target.value)
                    }
                    aria-label="Filtrar por Disponibilidad"
                  />
                  {filtros.disponibilidad && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("disponibilidad", "")}
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
                    onChange={(e) =>
                      handleFiltroChange("ubicacion", e.target.value)
                    }
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
                    value={filtros.usuarioActual}
                    onChange={(e) =>
                      handleFiltroChange("usuarioActual", e.target.value)
                    }
                    aria-label="Filtrar por Usuario actual"
                  />
                  {filtros.usuarioActual && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro-columna"
                      onClick={() => handleFiltroChange("usuarioActual", "")}
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
            {cargando ? (
              <tr>
                <td colSpan="6" className="tabla-mensaje-estado">
                  Cargando inventario...
                </td>
              </tr>
            ) : datosOrdenadosYFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="tabla-mensaje-estado">
                  {equipos.length === 0
                    ? "No hay equipos registrados."
                    : "No se encontraron equipos que coincidan con los filtros aplicados."}
                </td>
              </tr>
            ) : (
              datosOrdenadosYFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.raw.tipo_equipo}</strong> - {item.raw.marca}{" "}
                    {item.raw.modelo}
                    {item.raw.numero_serie
                      ? ` - NS ${item.raw.numero_serie}`
                      : ""}
                  </td>
                  <td>{item.estado}</td>
                  <td>{item.detalle}</td>
                  <td>
                    <span
                      className={`badge-disponibilidad ${item.estaDisponible ? "disponible" : "en-uso"}`}
                    >
                      {item.disponibilidad}
                    </span>
                  </td>
                  <td>{item.ubicacion}</td>
                  <td>{item.usuarioActual}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
