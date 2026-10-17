import { TextInput } from "./TextInput";
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
        id_equipo: "",
        id_ubicacion: "",
        observaciones: "",
        tipo_movimiento: ""
    });

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

        // 1. Si el usuario cambia el tipo de movimiento, limpiamos la ubicación y el equipo seleccionados
        if (name === "tipo_movimiento") {
            newData.id_ubicacion = "";
            newData.id_equipo = "";
        }

        // 2. Si el usuario cambia la ubicación, limpiamos el equipo seleccionado
        if (name === "id_ubicacion") {
            newData.id_equipo = "";
        }

        setData(newData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) return alert("Debes iniciar sesión para registrar un movimiento.");
        if (!data.id_equipo || !data.id_ubicacion || !data.tipo_movimiento) {
            return alert("Faltan datos obligatorios.");
        }

        const equipoActual = equipos.find(eq => eq.id_equipo.toString() === data.id_equipo);

        if (!equipoActual) {
            return alert("Equipo no encontrado.");
        }

        if (equipoActual.disponibilidad === false && data.tipo_movimiento === "Salida") {
            return alert("Error crítico: No se puede dar salida a un equipo que no está disponible.");
        }
        if (equipoActual.disponibilidad === true && data.tipo_movimiento === "Ingreso") {
            return alert("Error crítico: No se puede ingresar un equipo que ya figura como disponible.");
        }
        if (data.tipo_movimiento === "Ingreso" && String(equipoActual.id_persona) !== String(user.id)) {
            return alert("Error crítico: No se puede ingresar un equipo que no tienes asignado.");
        }

        try {
            const { error: errorInsert } = await supabase
                .from('movimientos')
                .insert([{
                    id_persona: user.id,
                    id_equipo: parseInt(data.id_equipo),
                    id_ubicacion: parseInt(data.id_ubicacion),
                    tipo_movimiento: data.tipo_movimiento,
                    observaciones: data.observaciones
                }]);

            if (errorInsert) throw errorInsert;

            const nuevaDisponibilidad = data.tipo_movimiento === "Ingreso" ? true : false;
            const idUsuarioActualizado = nuevaDisponibilidad ? null : user.id;

            const { error: errorUpdate } = await supabase
                .from('inventarioequipos')
                .update({
                    disponibilidad: nuevaDisponibilidad,
                    id_ubicacion: parseInt(data.id_ubicacion),
                    id_persona: idUsuarioActualizado
                })
                .eq('id_equipo', parseInt(data.id_equipo));

            if (errorUpdate) throw errorUpdate;

            setEquipos(equipos.map(eq =>
                eq.id_equipo.toString() === data.id_equipo
                    ? { ...eq, disponibilidad: nuevaDisponibilidad, id_ubicacion: parseInt(data.id_ubicacion), id_persona: idUsuarioActualizado }
                    : eq
            ));

            alert("Movimiento registrado con éxito.");
            setData({ ...data, observaciones: "", tipo_movimiento: "", id_equipo: "", id_ubicacion: "" });

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

                {/* Paso 1: Tipo de movimiento */}
                <RadioButton
                    name="tipo_movimiento"
                    value={data.tipo_movimiento}
                    onChange={handleChange}
                    opciones={["Ingreso", "Salida"]}
                >
                    Movimiento:
                </RadioButton>

                {/* Paso 2: El tipo de movimiento desbloquea la ubicación */}
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

                {/* Paso 3: La ubicación desbloquea los equipos (filtrados por la ubicación seleccionada) */}
                <SelectInput
                    name="id_equipo"
                    value={data.id_equipo}
                    onChange={handleChange}
                    opciones={equiposFiltrados.map(eq => ({ value: eq.id_equipo, label: `${eq.tipo_equipo} ${eq.marca} ${eq.modelo}` }))}
                    disabled={equiposBloqueado}
                    placeholder={placeholderEquipo}
                >
                    Equipo:
                </SelectInput>


                <TextInput
                    name="observaciones"
                    id="observaciones"
                    value={data.observaciones}
                    onChange={handleChange}
                    placeholder="Observaciones (Opcional)"
                >
                    Observaciones:
                </TextInput>

                <BotonFormulario className="boton-formulario">Registrar Movimiento</BotonFormulario>
            </form>
        </div>
    );
};