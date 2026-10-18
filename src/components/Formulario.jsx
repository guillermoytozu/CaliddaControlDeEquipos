import { SelectInput } from "./SelectInput";
import { RadioButton } from "./RadioButton";
import { BotonFormulario } from "./BotonFormulario";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/supabaseClient";
import "./Formulario.css";

export const Formulario = () => {
  const { user } = useAuth();

  const [equipos, setEquipos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  const [data, setData] = useState({
    id_ubicacion: "",
    tipo_movimiento: "",
  });

  // Estado del selector principal de equipo
  const [equipoInput, setEquipoInput] = useState({
    id_equipo: "",
    estado: "operativo",
    observaciones: "",
  });

  // Lista de equipos adicionales que se muestran debajo
  const [equiposAgregados, setEquiposAgregados] = useState([]);

  const [estadosEnum, setEstadosEnum] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: equiposData } = await supabase
        .from("inventarioequipos")
        .select("*");
      const { data: ubicacionesData } = await supabase
        .from("ubicaciones")
        .select("*");
      const { data: estadosData, error: errorEstados } =
        await supabase.rpc("get_estados_equipo");

      if (equiposData) setEquipos(equiposData);
      if (ubicacionesData) setUbicaciones(ubicacionesData);
      if (errorEstados) console.error("Error cargando estados:", errorEstados);
      if (estadosData) setEstadosEnum(estadosData);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newData = { ...data, [name]: value };

    // 1. Si el usuario cambia el tipo de movimiento, limpiamos ubicación y equipos
    if (name === "tipo_movimiento") {
      newData.id_ubicacion = "";
      setEquipoInput({ id_equipo: "", estado: "operativo", observaciones: "" });
      setEquiposAgregados([]);
    }

    // 2. Si el usuario cambia la ubicación, limpiamos los equipos
    if (name === "id_ubicacion") {
      setEquipoInput({ id_equipo: "", estado: "operativo", observaciones: "" });
      setEquiposAgregados([]);
    }

    setData(newData);
  };

  // Crea un nuevo div de equipo adicional vacío
  const handleAgregarEquipoVacio = () => {
    if (!puedeAgregarAdicional) return;

    setEquiposAgregados((prev) => [
      ...prev,
      {
        id_equipo: "",
        estado: "operativo",
        observaciones: "",
      },
    ]);
  };

  // Permite eliminar un equipo adicional de la lista
  const handleEliminarEquipo = (indexAEliminar) => {
    setEquiposAgregados((prev) =>
      prev.filter((_, idx) => idx !== indexAEliminar),
    );
  };

  const handleEliminarPrincipal = () => {
    if (equiposAgregados.length > 0) {
      const [primero, ...resto] = equiposAgregados;
      setEquipoInput(primero);
      setEquiposAgregados(resto);
    }
  };

  // Permite editar un equipo adicional (equipo, estado u observaciones)
  const handleAgregadoChange = (index, campo, valor) => {
    setEquiposAgregados((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user)
      return alert("Debes iniciar sesión para registrar un movimiento.");
    if (!data.tipo_movimiento || !data.id_ubicacion) {
      return alert("Faltan datos obligatorios (Movimiento y Ubicación).");
    }

    // Equipos a registrar: el principal + los adicionales que tengan equipo elegido
    const equiposParaRegistrar = [];
    if (equipoInput.id_equipo) {
      equiposParaRegistrar.push(equipoInput);
    }
    for (const item of equiposAgregados) {
      if (item.id_equipo) {
        equiposParaRegistrar.push(item);
      }
    }

    if (equiposParaRegistrar.length === 0) {
      return alert("Debes seleccionar al menos un equipo.");
    }

    // Validar que si se agregó un div adicional, tenga un equipo seleccionado
    if (equiposAgregados.some((item) => !item.id_equipo)) {
      return alert(
        "Debes seleccionar un equipo en todas las filas adicionales agregadas o eliminarlas.",
      );
    }

    // Validar que no haya equipos duplicados
    const ids = equiposParaRegistrar.map((item) => item.id_equipo);
    if (new Set(ids).size !== ids.length) {
      return alert("No puedes registrar el mismo equipo más de una vez.");
    }

    // Validaciones individuales para cada equipo
    for (const item of equiposParaRegistrar) {
      const equipoActual = equipos.find(
        (eq) => eq.id_equipo.toString() === item.id_equipo.toString(),
      );

      if (!equipoActual) {
        return alert(
          "Uno de los equipos seleccionados no fue encontrado en la base de datos.",
        );
      }

      if (
        equipoActual.disponibilidad === false &&
        data.tipo_movimiento === "Salida"
      ) {
        return alert(
          `Error crítico: El equipo "${equipoActual.tipo_equipo} ${equipoActual.marca}" ya no está disponible.`,
        );
      }
      if (
        equipoActual.disponibilidad === true &&
        data.tipo_movimiento === "Ingreso"
      ) {
        return alert(
          `Error crítico: El equipo "${equipoActual.tipo_equipo} ${equipoActual.marca}" ya figura como disponible.`,
        );
      }
      if (
        data.tipo_movimiento === "Ingreso" &&
        String(equipoActual.id_persona) !== String(user.id)
      ) {
        return alert(
          `Error crítico: No puedes ingresar el equipo "${equipoActual.tipo_equipo} ${equipoActual.marca}" porque no te pertenece.`,
        );
      }
    }

    // 3. Confirmación tras pasar todas las validaciones
    const cantidad = equiposParaRegistrar.length;
    const confirmado = window.confirm(
      `¿Estás seguro de registrar este movimiento de ${cantidad} equipo(s)?`,
    );
    if (!confirmado) {
      return;
    }

    const esIngreso = data.tipo_movimiento === "Ingreso";

    try {
      // 1. Inserción de movimientos para cada equipo
      const movimientosAInsertar = equiposParaRegistrar.map((item) => {
        const equipoActual = equipos.find(
          (eq) => eq.id_equipo.toString() === item.id_equipo.toString(),
        );
        return {
          id_persona: user.id,
          id_equipo: parseInt(item.id_equipo),
          id_ubicacion: parseInt(data.id_ubicacion),
          tipo_movimiento: data.tipo_movimiento,
          observaciones: item.observaciones ? item.observaciones.trim() : "",
          estado_historico: esIngreso
            ? item.estado || equipoActual?.estado || "operativo"
            : equipoActual?.estado || null,
        };
      });

      const { error: errorInsert } = await supabase
        .from("movimientos")
        .insert(movimientosAInsertar);

      if (errorInsert) throw errorInsert;

      // 2. Actualización de inventarioequipos para todos los equipos seleccionados
      if (esIngreso) {
        // En Ingreso: actualizamos disponibilidad a true, liberamos usuario (null) y actualizamos estado
        const promesasUpdate = equiposParaRegistrar.map((item) => {
          const estadoFinal = item.estado || "operativo";
          return supabase
            .from("inventarioequipos")
            .update({
              disponibilidad: true,
              id_ubicacion: parseInt(data.id_ubicacion),
              id_persona: null,
              estado: estadoFinal,
            })
            .eq("id_equipo", parseInt(item.id_equipo));
        });

        const respuestasUpdate = await Promise.all(promesasUpdate);
        const primerError = respuestasUpdate.find((r) => r.error);
        if (primerError) throw primerError.error;

        // 3. Actualizar estado local
        setEquipos(
          equipos.map((eq) => {
            const reg = equiposParaRegistrar.find(
              (item) => item.id_equipo.toString() === eq.id_equipo.toString(),
            );
            if (reg) {
              return {
                ...eq,
                disponibilidad: true,
                id_ubicacion: parseInt(data.id_ubicacion),
                id_persona: null,
                estado: reg.estado || eq.estado || "operativo",
              };
            }
            return eq;
          }),
        );
      } else {
        // En Salida: actualizamos disponibilidad a false y asignamos a usuario
        const idsEquiposInt = equiposParaRegistrar.map((item) =>
          parseInt(item.id_equipo),
        );
        const { error: errorUpdate } = await supabase
          .from("inventarioequipos")
          .update({
            disponibilidad: false,
            id_ubicacion: parseInt(data.id_ubicacion),
            id_persona: user.id,
          })
          .in("id_equipo", idsEquiposInt);

        if (errorUpdate) throw errorUpdate;

        // 3. Actualizar estado local
        setEquipos(
          equipos.map((eq) =>
            idsEquiposInt.includes(eq.id_equipo)
              ? {
                  ...eq,
                  disponibilidad: false,
                  id_ubicacion: parseInt(data.id_ubicacion),
                  id_persona: user.id,
                }
              : eq,
          ),
        );
      }

      alert(
        `${cantidad} ${cantidad === 1 ? "movimiento registrado" : "movimientos registrados"} con éxito.`,
      );
      setData({ tipo_movimiento: "", id_ubicacion: "" });
      setEquipoInput({ id_equipo: "", estado: "operativo", observaciones: "" });
      setEquiposAgregados([]);
    } catch (error) {
      console.error("Error en la base de datos:", error);
      alert("Hubo un error al procesar el movimiento.");
    }
  };

  // Opciones de ubicación dinámicas
  const opcionesUbicacionDinamicas = ubicaciones.map((ub) => ({
    value: ub.id_ubicacion,
    label: ub.ubicacion,
  }));

  // Lógica de filtrado de equipos: la ubicación desbloquea y filtra los equipos
  let equiposFiltrados = [];
  if (data.tipo_movimiento === "Salida" && data.id_ubicacion) {
    equiposFiltrados = equipos.filter(
      (eq) =>
        eq.disponibilidad === true &&
        eq.id_ubicacion?.toString() === data.id_ubicacion.toString(),
    );
  } else if (data.tipo_movimiento === "Ingreso" && data.id_ubicacion && user) {
    equiposFiltrados = equipos.filter(
      (eq) =>
        eq.disponibilidad === false &&
        Boolean(eq.id_persona) &&
        String(eq.id_persona) === String(user.id),
    );
  }

  // IDs de equipos seleccionados en los selectores adicionales
  const idsEnAdicionales = equiposAgregados
    .map((item) => item.id_equipo)
    .filter(Boolean)
    .map(String);

  // Opciones para el selector principal: excluye equipos seleccionados en los adicionales
  const opcionesParaPrimerComponente = equiposFiltrados
    .filter((eq) => !idsEnAdicionales.includes(eq.id_equipo.toString()))
    .map((eq) => ({
      value: eq.id_equipo,
      label: `${eq.tipo_equipo} ${eq.marca} ${eq.modelo}${eq.numero_serie ? ` - NS ${eq.numero_serie}` : ""}`,
    }));

  // Opciones para cada selector adicional: excluye el equipo principal y los de otros adicionales
  const getOpcionesParaAgregado = (indexActual) => {
    const idsOtros = [];
    if (equipoInput.id_equipo) {
      idsOtros.push(equipoInput.id_equipo.toString());
    }
    equiposAgregados.forEach((item, idx) => {
      if (idx !== indexActual && item.id_equipo) {
        idsOtros.push(item.id_equipo.toString());
      }
    });

    return equiposFiltrados
      .filter((eq) => !idsOtros.includes(eq.id_equipo.toString()))
      .map((eq) => ({
        value: eq.id_equipo,
        label: `${eq.tipo_equipo} ${eq.marca} ${eq.modelo}${eq.numero_serie ? ` - NS ${eq.numero_serie}` : ""}`,
      }));
  };

  // Determinar si el movimiento actual es Ingreso
  const esIngreso = data.tipo_movimiento === "Ingreso";

  // Opciones para el selector de estado
  const opcionesEstado = estadosEnum.map((est) => ({
    value: est,
    label: est.charAt(0).toUpperCase() + est.slice(1),
  }));

  // Bloqueo general de equipos si no se ha completado movimiento o ubicación
  const equiposBloqueado =
    !data.tipo_movimiento ||
    !data.id_ubicacion ||
    equiposFiltrados.length === 0;

  // Validación para el botón "+" que agrega un nuevo div adicional
  const ultimoAdicional =
    equiposAgregados.length > 0
      ? equiposAgregados[equiposAgregados.length - 1]
      : null;
  const ultimoTieneEquipo = ultimoAdicional
    ? Boolean(ultimoAdicional.id_equipo)
    : true;
  const principalTieneEquipo = Boolean(equipoInput.id_equipo);
  const totalSeleccionados =
    (equipoInput.id_equipo ? 1 : 0) +
    equiposAgregados.filter((item) => item.id_equipo).length;
  const hayMasEquipos = totalSeleccionados < equiposFiltrados.length;

  const puedeAgregarAdicional =
    !equiposBloqueado &&
    principalTieneEquipo &&
    ultimoTieneEquipo &&
    hayMasEquipos;

  let tooltipBotonAgregar = "Agregar otro equipo";
  if (equiposBloqueado) {
    tooltipBotonAgregar = "Seleccione movimiento y ubicación primero";
  } else if (!principalTieneEquipo) {
    tooltipBotonAgregar = "Selecciona el equipo principal primero";
  } else if (!ultimoTieneEquipo) {
    tooltipBotonAgregar = "Selecciona un equipo en la fila anterior primero";
  } else if (!hayMasEquipos) {
    tooltipBotonAgregar = "Todos los equipos disponibles ya han sido agregados";
  }

  let placeholderPrimerComponente = "Seleccione equipo...";
  if (equiposBloqueado) {
    placeholderPrimerComponente = !data.tipo_movimiento
      ? "Seleccione movimiento primero..."
      : !data.id_ubicacion
        ? "Seleccione ubicación primero..."
        : data.tipo_movimiento === "Salida"
          ? "No hay equipos disponibles en esta ubicación"
          : "No tienes equipos asignados para ingresar";
  }

  return (
    <div className="formulario-container">
      <form className="formulario-equipos" onSubmit={handleSubmit}>
        <div className="formulario-header">
          <h2 className="formulario-titulo">Registrar Movimiento</h2>
        </div>

        <div className="formulario-usuario-badge">
          <span className="usuario-badge-icon" aria-hidden="true">
            👤
          </span>
          <span id="input-nombre" className="usuario-badge-text">
            Usuario:{" "}
            <strong>
              {user ? user.user_metadata?.full_name : "No autenticado"}
            </strong>
          </span>
        </div>

        <RadioButton
          name="tipo_movimiento"
          value={data.tipo_movimiento}
          onChange={handleChange}
          opciones={["Ingreso", "Salida"]}
        >
          Movimiento:
        </RadioButton>

        <SelectInput
          name="id_ubicacion"
          value={data.id_ubicacion}
          onChange={handleChange}
          opciones={opcionesUbicacionDinamicas}
          disabled={!data.tipo_movimiento}
          placeholder={
            !data.tipo_movimiento
              ? "Seleccione movimiento primero..."
              : "Seleccione ubicación..."
          }
        >
          Ubicación:
        </SelectInput>

        {/* Selector principal de equipo: permanece en su posición, sin botón "+" */}
        <SelectInput
          name="id_equipo_principal"
          value={equipoInput.id_equipo}
          onChange={(e) => {
            const idSel = e.target.value;
            const eqObj = equipos.find(
              (eq) => eq.id_equipo.toString() === idSel.toString(),
            );
            setEquipoInput((prev) => ({
              ...prev,
              id_equipo: idSel,
              estado: eqObj?.estado || prev.estado || "operativo",
            }));
          }}
          opciones={opcionesParaPrimerComponente}
          disabled={equiposBloqueado}
          placeholder={placeholderPrimerComponente}
          mostrarEstado={esIngreso}
          labelEstado="Estado:"
          estado={equipoInput.estado || "operativo"}
          onEstadoChange={(e) =>
            setEquipoInput((prev) => ({ ...prev, estado: e.target.value }))
          }
          opcionesEstado={opcionesEstado}
          mostrarObservaciones={true}
          labelObservaciones="Observaciones (Opcional):"
          observaciones={equipoInput.observaciones}
          onObservacionesChange={(e) =>
            setEquipoInput((prev) => ({
              ...prev,
              observaciones: e.target.value,
            }))
          }
          placeholderObservaciones="Observaciones de este equipo (Opcional)"
          mostrarBotonAgregar={false}
          mostrarBotonEliminar={equiposAgregados.length > 0}
          onEliminar={handleEliminarPrincipal}
          tooltipEliminar="Eliminar este equipo"
        >
          Equipo #1:
        </SelectInput>

        {/* Equipos adicionales: se muestran debajo del selector principal */}
        {equiposAgregados.length > 0 && (
          <div className="contenedor-equipos-agregados">
            {equiposAgregados.map((item, index) => (
              <div key={index} className="equipo-adicional-fila">
                <SelectInput
                  name={`id_equipo_agregado_${index}`}
                  value={item.id_equipo}
                  onChange={(e) => {
                    const idSel = e.target.value;
                    const eqObj = equipos.find(
                      (eq) => eq.id_equipo.toString() === idSel.toString(),
                    );
                    handleAgregadoChange(index, "id_equipo", idSel);
                    if (eqObj?.estado) {
                      handleAgregadoChange(index, "estado", eqObj.estado);
                    }
                  }}
                  opciones={getOpcionesParaAgregado(index)}
                  disabled={equiposBloqueado}
                  placeholder="Seleccione equipo adicional..."
                  mostrarEstado={esIngreso}
                  labelEstado="Estado:"
                  estado={item.estado || "operativo"}
                  onEstadoChange={(e) =>
                    handleAgregadoChange(index, "estado", e.target.value)
                  }
                  opcionesEstado={opcionesEstado}
                  mostrarObservaciones={true}
                  labelObservaciones={`Observaciones (Equipo #${index + 2}):`}
                  observaciones={item.observaciones}
                  onObservacionesChange={(e) =>
                    handleAgregadoChange(index, "observaciones", e.target.value)
                  }
                  placeholderObservaciones="Observaciones de este equipo (Opcional)"
                  mostrarBotonAgregar={false}
                  mostrarBotonEliminar={true}
                  onEliminar={() => handleEliminarEquipo(index)}
                  tooltipEliminar="Eliminar este equipo"
                >
                  {`Equipo #${index + 2}:`}
                </SelectInput>
              </div>
            ))}
          </div>
        )}

        {/* Botón "+" para agregar un nuevo div de equipo adicional */}
        <div className="contenedor-boton-agregar-adicional">
          <button
            type="button"
            className="btn-select-accion btn-select-agregar"
            onClick={handleAgregarEquipoVacio}
            disabled={!puedeAgregarAdicional}
            title={tooltipBotonAgregar}
            aria-label="Agregar otro equipo"
          >
            +
          </button>
          <span className="texto-agregar-equipo">
            {equiposAgregados.length === 0
              ? "Agregar otro equipo"
              : "Agregar otro equipo adicional"}
          </span>
        </div>

        <BotonFormulario className="boton-formulario">
          Registrar Movimiento
        </BotonFormulario>
      </form>
    </div>
  );
};
