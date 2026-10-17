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

  // Estado del primer componente (área de selección)
  const [equipoInput, setEquipoInput] = useState({
    id_equipo: "",
    estado: "operativo",
    observaciones: "",
  });

  // Lista de equipos que se van agregando hacia abajo
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

  // Al presionar "+", el equipo seleccionado se va hacia abajo y el primer componente queda listo para otro equipo
  const handleAgregarEquipo = () => {
    if (!equipoInput.id_equipo) return;

    setEquiposAgregados((prev) => [
      ...prev,
      {
        id_equipo: equipoInput.id_equipo,
        estado: equipoInput.estado || "operativo",
        observaciones: equipoInput.observaciones,
      },
    ]);

    // Resetea el primer componente dejándolo listo para seleccionar otro equipo
    setEquipoInput({ id_equipo: "", estado: "operativo", observaciones: "" });
  };

  // Permite eliminar un equipo de la lista de abajo
  const handleEliminarEquipo = (indexAEliminar) => {
    setEquiposAgregados((prev) =>
      prev.filter((_, idx) => idx !== indexAEliminar),
    );
  };

  // Permite editar un equipo o sus observaciones/estado en la lista de abajo
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

    // Equipos a registrar: los que están en la lista de abajo + el equipo del primer selector si seleccionó uno sin presionar "+"
    const equiposParaRegistrar = [...equiposAgregados];
    if (equipoInput.id_equipo) {
      equiposParaRegistrar.push(equipoInput);
    }

    if (equiposParaRegistrar.length === 0) {
      return alert("Debes seleccionar al menos un equipo.");
    }

    // Validar que no haya equipos duplicados
    const ids = equiposParaRegistrar.map((item) => item.id_equipo);
    if (new Set(ids).size !== ids.length) {
      return alert("No puedes registrar el mismo equipo más de una vez.");
    }

    // Validaciones individuales para cada equipo
    for (const item of equiposParaRegistrar) {
      const equipoActual = equipos.find(
        (eq) => eq.id_equipo.toString() === item.id_equipo,
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

      const cantidad = equiposParaRegistrar.length;
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
    // En Salida: solo equipos disponibles en la ubicación seleccionada
    equiposFiltrados = equipos.filter(
      (eq) =>
        eq.disponibilidad === true &&
        eq.id_ubicacion?.toString() === data.id_ubicacion.toString(),
    );
  } else if (data.tipo_movimiento === "Ingreso" && data.id_ubicacion && user) {
    // En Ingreso: equipos del usuario que se ingresarán a dicha ubicación
    equiposFiltrados = equipos.filter(
      (eq) =>
        eq.disponibilidad === false &&
        Boolean(eq.id_persona) &&
        String(eq.id_persona) === String(user.id),
    );
  }

  // IDs de equipos que ya han sido agregados abajo
  const idsAgregados = equiposAgregados.map((item) => item.id_equipo);

  // Opciones para el selector superior (primer componente):
  // Excluye los equipos que ya están en la lista de abajo
  const opcionesParaPrimerComponente = equiposFiltrados
    .filter((eq) => !idsAgregados.includes(eq.id_equipo.toString()))
    .map((eq) => ({
      value: eq.id_equipo,
      label: `${eq.tipo_equipo} ${eq.marca} ${eq.modelo}`,
    }));

  // Opciones para cada selector de los equipos de abajo
  const getOpcionesParaAgregado = (indexActual) => {
    const idsOtrosAgregados = equiposAgregados
      .filter((_, idx) => idx !== indexActual)
      .map((item) => item.id_equipo);

    if (equipoInput.id_equipo) {
      idsOtrosAgregados.push(equipoInput.id_equipo);
    }

    return equiposFiltrados
      .filter((eq) => !idsOtrosAgregados.includes(eq.id_equipo.toString()))
      .map((eq) => ({
        value: eq.id_equipo,
        label: `${eq.tipo_equipo} ${eq.marca} ${eq.modelo}`,
      }));
  };

  // Determinar si el movimiento actual es Ingreso (habilita el selector de estado)
  const esIngreso = data.tipo_movimiento === "Ingreso";

  // Opciones para el selector de estado recogidas del Enumerated Type estado_equipo
  const opcionesEstado = estadosEnum.map((est) => ({
    value: est,
    label: est.charAt(0).toUpperCase() + est.slice(1),
  }));

  // Placeholder dinámico para el selector de equipo
  let placeholderEquipo = "Seleccione equipo...";
  if (!data.tipo_movimiento) {
    placeholderEquipo = "Seleccione movimiento primero...";
  } else if (!data.id_ubicacion) {
    placeholderEquipo = "Seleccione ubicación primero...";
  } else if (equiposFiltrados.length === 0) {
    placeholderEquipo =
      data.tipo_movimiento === "Salida"
        ? "No hay equipos disponibles en esta ubicación"
        : "No tienes equipos asignados para ingresar";
  }

  const equiposBloqueado =
    !data.tipo_movimiento ||
    !data.id_ubicacion ||
    equiposFiltrados.length === 0;

  // Validación para el botón "+" del primer componente:
  const puedeAgregar = !equiposBloqueado && Boolean(equipoInput.id_equipo);

  let tooltipBotonAgregar = "Agregar este equipo a la lista de abajo";
  if (equiposBloqueado) {
    tooltipBotonAgregar = "Seleccione movimiento y ubicación primero";
  } else if (!equipoInput.id_equipo) {
    tooltipBotonAgregar = "Selecciona un equipo primero";
  }

  let placeholderPrimerComponente = "Seleccione equipo...";
  if (equiposBloqueado) {
    placeholderPrimerComponente = placeholderEquipo;
  } else if (
    opcionesParaPrimerComponente.length === 0 &&
    equiposAgregados.length > 0
  ) {
    placeholderPrimerComponente =
      "Todos los equipos disponibles han sido agregados";
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

        {/* 1. Primer componente SelectInput: tiene botón "+", pero NO "x" */}
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
          disabled={
            equiposBloqueado ||
            (opcionesParaPrimerComponente.length === 0 &&
              equiposAgregados.length > 0)
          }
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
          mostrarBotonAgregar={true}
          onAgregar={handleAgregarEquipo}
          disabledAgregar={!puedeAgregar}
          tooltipAgregar={tooltipBotonAgregar}
          mostrarBotonEliminar={false}
        >
          Equipo:
        </SelectInput>

        {/* 2. Elementos que se van hacia abajo: tienen botón "x", pero NO "+" */}
        {equiposAgregados.length > 0 && (
          <div className="contenedor-equipos-agregados">
            <div className="equipos-agregados-titulo">
              <span>Equipos en la lista ({equiposAgregados.length}):</span>
            </div>
            {equiposAgregados.map((item, index) => (
              <SelectInput
                key={index}
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
                placeholder="Equipo seleccionado"
                mostrarEstado={esIngreso}
                labelEstado="Estado:"
                estado={item.estado || "operativo"}
                onEstadoChange={(e) =>
                  handleAgregadoChange(index, "estado", e.target.value)
                }
                opcionesEstado={opcionesEstado}
                mostrarObservaciones={true}
                labelObservaciones={`Observaciones (Equipo #${index + 1}):`}
                observaciones={item.observaciones}
                onObservacionesChange={(e) =>
                  handleAgregadoChange(index, "observaciones", e.target.value)
                }
                placeholderObservaciones="Observaciones de este equipo (Opcional)"
                mostrarBotonAgregar={false}
                mostrarBotonEliminar={true}
                onEliminar={() => handleEliminarEquipo(index)}
                tooltipEliminar="Quitar de la lista"
              >
                {`Equipo #${index + 1}:`}
              </SelectInput>
            ))}
          </div>
        )}

        <BotonFormulario className="boton-formulario">
          Registrar Movimiento
        </BotonFormulario>
      </form>
    </div>
  );
};
