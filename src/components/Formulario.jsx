import { SelectInput } from "./SelectInput";
import { RadioButton } from "./RadioButton";
import { BotonFormulario } from "./BotonFormulario";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/supabaseClient";
import "./Formulario.css";

const BUCKET_FOTOS = "movimientos-fotos";
const MAX_FOTO_MB = 5;

// Estructura base de un equipo en el formulario (incluye la foto adjunta)
const EQUIPO_VACIO = {
  id_equipo: "",
  estado: "operativo",
  observaciones: "",
  foto: null,
};

// Devuelve un mensaje de error si la foto no es válida, o null si está bien
const validarFoto = (file) => {
  if (!file) return null;
  if (!file.type.startsWith("image/")) return "El archivo debe ser una imagen.";
  if (file.size > MAX_FOTO_MB * 1024 * 1024) {
    return `La imagen no puede superar ${MAX_FOTO_MB} MB.`;
  }
  return null;
};

export const Formulario = () => {
  const { user } = useAuth();

  const [equipos, setEquipos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  const [data, setData] = useState({
    id_ubicacion: "",
    id_ubicacion_destino: "",
    tipo_movimiento: "",
  });

  // Estado del selector principal de equipo
  const [equipoInput, setEquipoInput] = useState(EQUIPO_VACIO);

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

  // Un equipo está disponible si su ubicación actual está marcada como disponible
  const estaDisponible = (eq) => {
    const ub = ubicaciones.find(
      (u) => String(u.id_ubicacion) === String(eq.id_ubicacion),
    );
    return ub?.disponibilidad === true;
  };

  // Verificar si el usuario tiene equipos asignados (para habilitar el Ingreso)
  const usuarioTieneEquiposAsignados =
    user &&
    equipos.some(
      (eq) =>
        !estaDisponible(eq) &&
        Boolean(eq.id_persona) &&
        String(eq.id_persona) === String(user.id),
    );

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newData = { ...data, [name]: value };

    // 1. Si el usuario cambia el tipo de movimiento, limpiamos ubicaciones y equipos
    if (name === "tipo_movimiento") {
      newData.id_ubicacion = "";
      newData.id_ubicacion_destino = "";
      setEquipoInput(EQUIPO_VACIO);
      setEquiposAgregados([]);
    }

    // 2. Si el usuario cambia la ubicación de origen, limpiamos los equipos y ubicación de destino
    if (name === "id_ubicacion") {
      newData.id_ubicacion_destino = "";
      setEquipoInput(EQUIPO_VACIO);
      setEquiposAgregados([]);
    }

    // 3. Si el usuario cambia la ubicación de destino, limpiamos los equipos
    if (name === "id_ubicacion_destino") {
      setEquipoInput(EQUIPO_VACIO);
      setEquiposAgregados([]);
    }

    setData(newData);
  };

  // Crea un nuevo div de equipo adicional vacío
  const handleAgregarEquipoVacio = () => {
    if (!puedeAgregarAdicional) return;

    setEquiposAgregados((prev) => [...prev, { ...EQUIPO_VACIO }]);
  };

  // Permite eliminar un equipo adicional de la lista
  const handleEliminarEquipo = (indexAEliminar) => {
    setEquiposAgregados((prev) =>
      prev.filter((_, idx) => idx !== indexAEliminar),
    );
  };

  // Al eliminar el principal, el primer adicional (con su foto) pasa a ser el principal
  const handleEliminarPrincipal = () => {
    if (equiposAgregados.length > 0) {
      const [primero, ...resto] = equiposAgregados;
      setEquipoInput(primero);
      setEquiposAgregados(resto);
    }
  };

  // Permite editar un equipo adicional (equipo, estado, observaciones o foto)
  const handleAgregadoChange = (index, campo, valor) => {
    setEquiposAgregados((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  // Maneja el archivo elegido en el input de foto (también recibe files: [] al quitar)
  const obtenerFotoDelEvento = (e) => {
    const file = e.target.files?.[0] ?? null;
    const error = validarFoto(file);
    if (error) {
      alert(error);
      return undefined; // undefined = no cambiar nada
    }
    return file;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user)
      return alert("Debes iniciar sesión para registrar un movimiento.");
    if (!data.tipo_movimiento) {
      return alert("Debes seleccionar el tipo de movimiento.");
    }
    if (data.tipo_movimiento === "Salida" && !data.id_ubicacion) {
      return alert("Debes seleccionar una ubicación de origen.");
    }
    if (!data.id_ubicacion_destino) {
      return alert("Debes seleccionar una ubicación de destino.");
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

      const disponible = estaDisponible(equipoActual);

      if (!disponible && data.tipo_movimiento === "Salida") {
        return alert(
          `Error crítico: El equipo "${equipoActual.tipo_equipo} ${equipoActual.marca}" ya no está disponible.`,
        );
      }
      if (disponible && data.tipo_movimiento === "Ingreso") {
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

      // Si quieres que la foto sea obligatoria, descomenta:
      // if (!item.foto) {
      //   return alert(`Debes adjuntar una foto del equipo "${equipoActual.tipo_equipo} ${equipoActual.marca}".`);
      // }
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

    // Rutas de fotos subidas (para limpiar si el movimiento no llega a guardarse)
    const rutasSubidas = [];
    let movimientosInsertados = false;

    try {
      // 0. Subida de fotos a Supabase Storage (una por equipo, si la hay)
      const rutasFotos = await Promise.all(
        equiposParaRegistrar.map(async (item) => {
          if (!item.foto) return null;
          const ext = item.foto.name.split(".").pop()?.toLowerCase() || "jpg";
          const ruta = `${user.id}/${Date.now()}_${item.id_equipo}.${ext}`;
          const { error } = await supabase.storage
            .from(BUCKET_FOTOS)
            .upload(ruta, item.foto, {
              contentType: item.foto.type,
              upsert: false,
            });
          if (error) throw error;
          rutasSubidas.push(ruta);
          return ruta;
        }),
      );

      // 1. Inserción de movimientos para cada equipo
      // id_ubicacion_origen = ubicación que tenía el equipo; id_ubicacion_destino = ubicación elegida
      const movimientosAInsertar = equiposParaRegistrar.map((item, idx) => {
        const equipoActual = equipos.find(
          (eq) => eq.id_equipo.toString() === item.id_equipo.toString(),
        );
        return {
          id_persona: user.id,
          id_equipo: parseInt(item.id_equipo),
          id_ubicacion_origen: equipoActual?.id_ubicacion ?? null,
          id_ubicacion_destino: parseInt(data.id_ubicacion_destino),
          tipo_movimiento: data.tipo_movimiento,
          observaciones: item.observaciones ? item.observaciones.trim() : "",
          estado_historico: esIngreso
            ? item.estado || equipoActual?.estado || "operativo"
            : equipoActual?.estado || null,
          foto_path: rutasFotos[idx],
        };
      });

      const { error: errorInsert } = await supabase
        .from("movimientos")
        .insert(movimientosAInsertar);

      if (errorInsert) throw errorInsert;
      movimientosInsertados = true;

      // 2. Actualización de inventarioequipos para todos los equipos seleccionados
      // La ubicación del equipo se actualiza siempre con la ubicación de destino
      const idUbicacionDestino = parseInt(data.id_ubicacion_destino);

      if (esIngreso) {
        // En Ingreso: liberamos usuario (null), actualizamos estado y ubicación de destino
        const promesasUpdate = equiposParaRegistrar.map((item) => {
          const estadoFinal = item.estado || "operativo";
          return supabase
            .from("inventarioequipos")
            .update({
              id_ubicacion: idUbicacionDestino,
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
                id_ubicacion: idUbicacionDestino,
                id_persona: null,
                estado: reg.estado || eq.estado || "operativo",
              };
            }
            return eq;
          }),
        );
      } else {
        // En Salida: asignamos el equipo al usuario y a la ubicación de destino
        const idsEquiposInt = equiposParaRegistrar.map((item) =>
          parseInt(item.id_equipo),
        );
        const { error: errorUpdate } = await supabase
          .from("inventarioequipos")
          .update({
            id_ubicacion: idUbicacionDestino,
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
                  id_ubicacion: idUbicacionDestino,
                  id_persona: user.id,
                }
              : eq,
          ),
        );
      }

      alert(
        `${cantidad} ${cantidad === 1 ? "movimiento registrado" : "movimientos registrados"} con éxito.`,
      );
      setData({
        tipo_movimiento: "",
        id_ubicacion: "",
        id_ubicacion_destino: "",
      });
      setEquipoInput(EQUIPO_VACIO);
      setEquiposAgregados([]);
    } catch (error) {
      console.error("Error en la base de datos:", error);
      // Si el movimiento no se guardó, borramos las fotos que alcanzaron a subirse
      if (!movimientosInsertados && rutasSubidas.length > 0) {
        await supabase.storage.from(BUCKET_FOTOS).remove(rutasSubidas);
      }
      alert("Hubo un error al procesar el movimiento.");
    }
  };

  // Origen (solo Salida): ubicaciones donde hay equipos disponibles
  const opcionesUbicacionDinamicas = ubicaciones
    .filter((ub) => ub.disponibilidad === true)
    .map((ub) => ({ value: ub.id_ubicacion, label: ub.ubicacion }));

  // Destino: Salida -> ubicaciones NO disponibles; Ingreso -> ubicaciones disponibles
  const opcionesUbicacionDestino = ubicaciones
    .filter((ub) =>
      data.tipo_movimiento === "Salida"
        ? ub.disponibilidad === false
        : ub.disponibilidad === true,
    )
    .map((ub) => ({ value: ub.id_ubicacion, label: ub.ubicacion }));

  // Lógica de filtrado de equipos: la ubicación desbloquea y filtra los equipos
  let equiposFiltrados = [];

  if (data.tipo_movimiento === "Salida" && data.id_ubicacion) {
    equiposFiltrados = equipos.filter(
      (eq) =>
        estaDisponible(eq) &&
        String(eq.id_ubicacion) === String(data.id_ubicacion),
    );
  } else if (
    data.tipo_movimiento === "Ingreso" &&
    data.id_ubicacion_destino &&
    user
  ) {
    equiposFiltrados = equipos.filter(
      (eq) =>
        !estaDisponible(eq) &&
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

  // Ingreso sin equipos asignados al usuario: no hay nada que ingresar
  const sinEquiposParaIngreso = esIngreso && !usuarioTieneEquiposAsignados;

  // Opciones para el selector de estado
  const opcionesEstado = estadosEnum.map((est) => ({
    value: est,
    label: est.charAt(0).toUpperCase() + est.slice(1),
  }));

  // Bloqueo general de equipos si no se ha completado movimiento, ubicación de origen o destino
  const equiposBloqueado =
    !data.tipo_movimiento ||
    (data.tipo_movimiento === "Salida" && !data.id_ubicacion) ||
    !data.id_ubicacion_destino ||
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
    tooltipBotonAgregar = "Seleccione movimiento y ubicaciones primero";
  } else if (!principalTieneEquipo) {
    tooltipBotonAgregar = "Selecciona el equipo principal primero";
  } else if (!ultimoTieneEquipo) {
    tooltipBotonAgregar = "Selecciona un equipo en la fila anterior primero";
  } else if (!hayMasEquipos) {
    tooltipBotonAgregar = "Todos los equipos disponibles ya han sido agregados";
  }

  // Placeholder dinámico del selector de equipo principal
  let placeholderPrimerComponente = "Seleccione equipo...";
  if (equiposBloqueado) {
    if (!data.tipo_movimiento) {
      placeholderPrimerComponente = "Seleccione movimiento primero...";
    } else if (sinEquiposParaIngreso) {
      placeholderPrimerComponente = "No tienes equipos asignados para ingresar";
    } else if (data.tipo_movimiento === "Salida" && !data.id_ubicacion) {
      placeholderPrimerComponente = "Seleccione ubicación de origen primero...";
    } else if (!data.id_ubicacion_destino) {
      placeholderPrimerComponente =
        "Seleccione ubicación de destino primero...";
    } else if (data.tipo_movimiento === "Salida") {
      placeholderPrimerComponente =
        "No hay equipos disponibles en esta ubicación";
    } else {
      placeholderPrimerComponente = "No tienes equipos asignados para ingresar";
    }
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
          Tipo de Movimiento:
        </RadioButton>

        {data.tipo_movimiento === "Salida" && (
          <SelectInput
            name="id_ubicacion"
            value={data.id_ubicacion}
            onChange={handleChange}
            opciones={opcionesUbicacionDinamicas}
            disabled={!data.tipo_movimiento}
            placeholder="Seleccione ubicación de origen..."
          >
            Ubicación de Origen:
          </SelectInput>
        )}

        <SelectInput
          name="id_ubicacion_destino"
          value={data.id_ubicacion_destino}
          onChange={handleChange}
          opciones={opcionesUbicacionDestino}
          disabled={
            !data.tipo_movimiento ||
            sinEquiposParaIngreso ||
            (data.tipo_movimiento === "Salida" && !data.id_ubicacion)
          }
          placeholder={
            !data.tipo_movimiento
              ? "Seleccione movimiento primero..."
              : sinEquiposParaIngreso
                ? "No tienes equipos asignados para ingresar"
                : data.tipo_movimiento === "Salida" && !data.id_ubicacion
                  ? "Seleccione ubicación de origen primero..."
                  : "Seleccione ubicación de destino..."
          }
        >
          Ubicación de Destino:
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
          mostrarFoto={true}
          labelFoto="Foto (Opcional):"
          foto={equipoInput.foto}
          onFotoChange={(e) => {
            const file = obtenerFotoDelEvento(e);
            if (file === undefined) return;
            setEquipoInput((prev) => ({ ...prev, foto: file }));
          }}
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
                  mostrarFoto={true}
                  labelFoto={`Foto (Equipo #${index + 2}):`}
                  foto={item.foto}
                  onFotoChange={(e) => {
                    const file = obtenerFotoDelEvento(e);
                    if (file === undefined) return;
                    handleAgregadoChange(index, "foto", file);
                  }}
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
