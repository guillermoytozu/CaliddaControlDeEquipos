import { TextInput } from "./TextInput";
import { SelectInput } from "./SelectInput";
import { RadioButton } from "./RadioButton";
import { BotonFormulario } from "./BotonFormulario";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../supabase/supabaseClient';
import './Formulario.css';

export const Formulario = () => {
    const { user } = useContext(AuthContext);

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

        if (name === "id_equipo") {
            const equipoSeleccionado = equipos.find(eq => eq.id_equipo.toString() === value);
            if (equipoSeleccionado) {
                const esSalida = equipoSeleccionado.disponibilidad;
                newData.tipo_movimiento = esSalida ? "Salida" : "Ingreso";

                // 1. LÓGICA DE UBICACIÓN AUTO-ASIGNADA
                if (esSalida) {
                    // Si el equipo está disponible (Salida), forzamos la ubicación actual del equipo
                    newData.id_ubicacion = equipoSeleccionado.id_ubicacion ? equipoSeleccionado.id_ubicacion.toString() : "";
                } else {
                    // Si el equipo no está disponible (Ingreso), borramos la ubicación para obligar al usuario a elegir
                    newData.id_ubicacion = "";
                }
            }
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

        if (equipoActual.disponibilidad === false && data.tipo_movimiento === "Salida") {
            return alert("Error crítico: No se puede dar salida a un equipo que no está disponible.");
        }
        if (equipoActual.disponibilidad === true && data.tipo_movimiento === "Ingreso") {
            return alert("Error crítico: No se puede ingresar un equipo que ya figura como disponible.");
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

            // NUEVO: Si es un Ingreso (se devuelve), el id_persona queda en null. 
            // Si es una Salida (se lo llevan), asignamos el ID del usuario logueado.
            const idUsuarioActualizado = nuevaDisponibilidad ? null : user.id;

            // B. Actualizar disponibilidad, ubicación y usuario en inventarioequipos
            const { error: errorUpdate } = await supabase
                .from('inventarioequipos')
                .update({
                    disponibilidad: nuevaDisponibilidad,
                    id_ubicacion: parseInt(data.id_ubicacion),
                    id_persona: idUsuarioActualizado
                })
                .eq('id_equipo', parseInt(data.id_equipo));

            if (errorUpdate) throw errorUpdate;

            // C. Actualizar estado local
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

    const equipoSeleccionadoInfo = equipos.find(eq => eq.id_equipo.toString() === data.id_equipo);

    const opcionesMovimientoDinamicas = equipoSeleccionadoInfo
        ? [equipoSeleccionadoInfo.disponibilidad ? "Salida" : "Ingreso"]
        : ["Ingreso", "Salida"];

    // 4. LÓGICA VISUAL: RESTRINGIR LAS OPCIONES DEL SELECTOR DE UBICACIÓN
    let opcionesUbicacionDinamicas = ubicaciones.map(ub => ({ value: ub.id_ubicacion, label: ub.ubicacion }));

    if (equipoSeleccionadoInfo && equipoSeleccionadoInfo.disponibilidad) {
        // Si el equipo va a salir, filtramos las ubicaciones para mostrar ÚNICAMENTE donde se encuentra ahora
        opcionesUbicacionDinamicas = opcionesUbicacionDinamicas.filter(
            ub => ub.value === equipoSeleccionadoInfo.id_ubicacion
        );
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

                <SelectInput
                    name="id_equipo"
                    value={data.id_equipo}
                    onChange={handleChange}
                    opciones={equipos.map(eq => ({ value: eq.id_equipo, label: `${eq.tipo_equipo} - ${eq.marca} ${eq.modelo}` }))}
                >
                    Equipo:
                </SelectInput>

                <SelectInput
                    name="id_ubicacion"
                    value={data.id_ubicacion}
                    onChange={handleChange}
                    opciones={opcionesUbicacionDinamicas}
                >
                    Ubicación:
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

                <RadioButton
                    name="tipo_movimiento"
                    value={data.tipo_movimiento}
                    onChange={handleChange}
                    opciones={opcionesMovimientoDinamicas}
                >
                    Movimiento:
                </RadioButton>

                <BotonFormulario className="boton-formulario">Registrar Movimiento</BotonFormulario>
            </form>
        </div>
    );
};