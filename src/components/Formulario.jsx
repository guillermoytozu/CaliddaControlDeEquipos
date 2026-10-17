import { SelectInput } from "./SelectInput";
import { RadioButton } from "./RadioButton";
import { BotonFormulario } from "./BotonFormulario";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from '../supabase/supabaseClient';
import './Formulario.css';

export const Formulario = () => {
    const { user } = useAuth();

    const [equipos, setEquipos] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);

    const [data, setData] = useState({
        id_ubicacion: "",
        tipo_movimiento: ""
    });

    const [equiposSeleccionados, setEquiposSeleccionados] = useState([
        { id_equipo: "", observaciones: "" }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: equiposData } = await supabase.from('inventarioequipos').select('*');
            const { data: ubicacionesData } = await supabase.from('ubicaciones').select('*');

            if (equiposData) setEquipos(equiposData);
            if (ubicacionesData) setUbicaciones(ubicacionesData);
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newData = { ...data, [name]: value };

        // 1. Si el usuario cambia el tipo de movimiento, limpiamos la ubicación y los equipos seleccionados
        if (name === "tipo_movimiento") {
            newData.id_ubicacion = "";
            setEquiposSeleccionados([{ id_equipo: "", observaciones: "" }]);
        }

        // 2. Si el usuario cambia la ubicación, limpiamos los equipos seleccionados
        if (name === "id_ubicacion") {
            setEquiposSeleccionados([{ id_equipo: "", observaciones: "" }]);
        }

        setData(newData);
    };

    const handleEquipoChange = (index, campo, valor) => {
        setEquiposSeleccionados(prev => {
            const copia = [...prev];
            copia[index] = { ...copia[index], [campo]: valor };
            return copia;
        });
    };

    const agregarFilaEquipo = () => {
        setEquiposSeleccionados(prev => [
            ...prev,
            { id_equipo: "", observaciones: "" }
        ]);
    };

    const eliminarFilaEquipo = (indexAEliminar) => {
        setEquiposSeleccionados(prev => prev.filter((_, idx) => idx !== indexAEliminar));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) return alert("Debes iniciar sesión para registrar un movimiento.");
        if (!data.tipo_movimiento || !data.id_ubicacion) {
            return alert("Faltan datos obligatorios (Movimiento y Ubicación).");
        }

        if (equiposSeleccionados.length === 0 || equiposSeleccionados.some(item => !item.id_equipo)) {
            return alert("Debes seleccionar un equipo en cada fila agregada.");
        }

        // Validar que no haya equipos duplicados
        const ids = equiposSeleccionados.map(item => item.id_equipo);
        if (new Set(ids).size !== ids.length) {
            return alert("No puedes seleccionar el mismo equipo más de una vez.");
        }

        // Validaciones individuales para cada equipo
        for (const item of equiposSeleccionados) {
            const equipoActual = equipos.find(eq => eq.id_equipo.toString() === item.id_equipo);

            if (!equipoActual) {
                return alert("Uno de los equipos seleccionados no fue encontrado en la base de datos.");
            }

            if (equipoActual.disponibilidad === false && data.tipo_movimiento === "Salida") {
                return alert(`Error crítico: El equipo "${equipoActual.tipo_equipo} ${equipoActual.marca}" ya no está disponible.`);
            }
            if (equipoActual.disponibilidad === true && data.tipo_movimiento === "Ingreso") {
                return alert(`Error crítico: El equipo "${equipoActual.tipo_equipo} ${equipoActual.marca}" ya figura como disponible.`);
            }
            if (data.tipo_movimiento === "Ingreso" && String(equipoActual.id_persona) !== String(user.id)) {
                return alert(`Error crítico: No puedes ingresar el equipo "${equipoActual.tipo_equipo} ${equipoActual.marca}" porque no te pertenece.`);
            }
        }

        try {
            // 1. Inserción de movimientos para cada equipo
            const movimientosAInsertar = equiposSeleccionados.map(item => ({
                id_persona: user.id,
                id_equipo: parseInt(item.id_equipo),
                id_ubicacion: parseInt(data.id_ubicacion),
                tipo_movimiento: data.tipo_movimiento,
                observaciones: item.observaciones ? item.observaciones.trim() : ""
            }));

            const { error: errorInsert } = await supabase
                .from('movimientos')
                .insert(movimientosAInsertar);

            if (errorInsert) throw errorInsert;

            // 2. Actualización de inventarioequipos para todos los equipos seleccionados
            const nuevaDisponibilidad = data.tipo_movimiento === "Ingreso" ? true : false;
            const idUsuarioActualizado = nuevaDisponibilidad ? null : user.id;
            const idsEquiposInt = equiposSeleccionados.map(item => parseInt(item.id_equipo));

            const { error: errorUpdate } = await supabase
                .from('inventarioequipos')
                .update({
                    disponibilidad: nuevaDisponibilidad,
                    id_ubicacion: parseInt(data.id_ubicacion),
                    id_persona: idUsuarioActualizado
                })
                .in('id_equipo', idsEquiposInt);

            if (errorUpdate) throw errorUpdate;

            // 3. Actualizar estado local
            setEquipos(equipos.map(eq =>
                idsEquiposInt.includes(eq.id_equipo)
                    ? { ...eq, disponibilidad: nuevaDisponibilidad, id_ubicacion: parseInt(data.id_ubicacion), id_persona: idUsuarioActualizado }
                    : eq
            ));

            const cantidad = equiposSeleccionados.length;
            alert(`${cantidad} ${cantidad === 1 ? "movimiento registrado" : "movimientos registrados"} con éxito.`);
            setData({ tipo_movimiento: "", id_ubicacion: "" });
            setEquiposSeleccionados([{ id_equipo: "", observaciones: "" }]);

        } catch (error) {
            console.error("Error en la base de datos:", error);
            alert("Hubo un error al procesar el movimiento.");
        }
    };

    // Opciones de ubicación dinámicas
    const opcionesUbicacionDinamicas = ubicaciones.map(ub => ({
        value: ub.id_ubicacion,
        label: ub.ubicacion
    }));

    // Lógica de filtrado de equipos: la ubicación desbloquea y filtra los equipos
    let equiposFiltrados = [];
    if (data.tipo_movimiento === "Salida" && data.id_ubicacion) {
        // En Salida: solo equipos disponibles en la ubicación seleccionada
        equiposFiltrados = equipos.filter(
            eq => eq.disponibilidad === true && eq.id_ubicacion?.toString() === data.id_ubicacion.toString()
        );
    } else if (data.tipo_movimiento === "Ingreso" && data.id_ubicacion && user) {
        // En Ingreso: equipos del usuario que se ingresarán a dicha ubicación
        equiposFiltrados = equipos.filter(
            eq => eq.disponibilidad === false && Boolean(eq.id_persona) && String(eq.id_persona) === String(user.id)
        );
    }

    // Opciones para cada selector de equipo (excluyendo los seleccionados en otras filas)
    const getOpcionesParaFila = (indexActual) => {
        const idsSeleccionadosEnOtras = equiposSeleccionados
            .filter((_, idx) => idx !== indexActual)
            .map(item => item.id_equipo)
            .filter(Boolean);

        return equiposFiltrados
            .filter(eq => !idsSeleccionadosEnOtras.includes(eq.id_equipo.toString()))
            .map(eq => ({
                value: eq.id_equipo,
                label: `${eq.tipo_equipo} ${eq.marca} ${eq.modelo}`
            }));
    };

    // Placeholder dinámico para el selector de equipo
    let placeholderEquipo = "Seleccione equipo...";
    if (!data.tipo_movimiento) {
        placeholderEquipo = "Seleccione movimiento primero...";
    } else if (!data.id_ubicacion) {
        placeholderEquipo = "Seleccione ubicación primero...";
    } else if (equiposFiltrados.length === 0) {
        placeholderEquipo = data.tipo_movimiento === "Salida"
            ? "No hay equipos disponibles en esta ubicación"
            : "No tienes equipos asignados para ingresar";
    }

    const equiposBloqueado = !data.tipo_movimiento || !data.id_ubicacion || equiposFiltrados.length === 0;

    // Validación para el botón de agregar "+":
    const puedeAgregarFila =
        !equiposBloqueado &&
        !equiposSeleccionados.some(item => !item.id_equipo) &&
        equiposSeleccionados.length < equiposFiltrados.length;

    let tooltipBotonAgregar = "Agregar otro equipo";
    if (equiposBloqueado) {
        tooltipBotonAgregar = "Seleccione movimiento y ubicación primero";
    } else if (equiposSeleccionados.some(item => !item.id_equipo)) {
        tooltipBotonAgregar = "Selecciona un equipo antes de agregar otro";
    } else if (equiposSeleccionados.length >= equiposFiltrados.length) {
        tooltipBotonAgregar = "No hay más equipos disponibles para agregar";
    }

    return (
        <div className="formulario-container">
            <form className="formulario-equipos" onSubmit={handleSubmit}>
                <div className="formulario-header">
                    <h2 className="formulario-titulo">Registrar Movimiento</h2>
                </div>

                <div className="formulario-usuario-badge">
                    <span className="usuario-badge-icon" aria-hidden="true">👤</span>
                    <span id="input-nombre" className="usuario-badge-text">
                        Usuario: <strong>{user ? user.user_metadata?.full_name : "No autenticado"}</strong>
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
                    placeholder={!data.tipo_movimiento ? "Seleccione movimiento primero..." : "Seleccione ubicación..."}
                >
                    Ubicación:
                </SelectInput>

                {/* Sección de Equipos y Observaciones Dinámicas integradas en SelectInput */}
                <div className="contenedor-equipos-dinamicos">
                    {equiposSeleccionados.map((item, index) => {
                        const labelEquipo = equiposSeleccionados.length === 1 ? "Equipo:" : `Equipo #${index + 1}:`;
                        const labelObservaciones = equiposSeleccionados.length === 1 ? "Observaciones (Opcional):" : `Observaciones (Equipo #${index + 1}):`;

                        return (
                            <SelectInput
                                key={index}
                                name={`id_equipo_${index}`}
                                value={item.id_equipo}
                                onChange={(e) => handleEquipoChange(index, "id_equipo", e.target.value)}
                                opciones={getOpcionesParaFila(index)}
                                disabled={equiposBloqueado}
                                placeholder={placeholderEquipo}
                                mostrarObservaciones={true}
                                labelObservaciones={labelObservaciones}
                                observaciones={item.observaciones}
                                onObservacionesChange={(e) => handleEquipoChange(index, "observaciones", e.target.value)}
                                placeholderObservaciones="Observaciones de este equipo (Opcional)"
                                mostrarBotonAgregar={true}
                                onAgregar={agregarFilaEquipo}
                                disabledAgregar={!puedeAgregarFila}
                                tooltipAgregar={tooltipBotonAgregar}
                                mostrarBotonEliminar={equiposSeleccionados.length > 1}
                                onEliminar={() => eliminarFilaEquipo(index)}
                            >
                                {labelEquipo}
                            </SelectInput>
                        );
                    })}
                </div>

                <BotonFormulario className="boton-formulario">Registrar Movimiento</BotonFormulario>
            </form>
        </div>
    );
};