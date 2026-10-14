import { TextInput } from "./TextInput";
import { SelectInput } from "./SelectInput";
import { RadioButton } from "./RadioButton";
import { BotonFormulario } from "./BotonFormulario";
import { useState } from "react";


const opcionesEquipo = [
    "Localizador de tuberías - Radiodetection RD8200G",
    "Detector multigas - MSA Altair 4XR",
    "Detector láser de metano - Heath Consultants RMLD-CS",
    "Máquina de electrofusión - Georg Fischer MSA 330",
    "Prensa estranguladora manual - Reed PES2",
    "Cortatubos tipo guillotina - Reed HPC4",
    "Raspador rotativo - Ritmo RTC 160",
    "Llave Stillson - EGA Master 70154",
    "Manómetro digital - Keller LEO 2",
    "Detector de defectos - Tinker & Rasor APS",
    "Roscadora eléctrica - Ridgid 690-I",
    "Multímetro industrial - Fluke 28 II Rugged",
    "Alineador mecánico - Ritmo 63-200"
];
const opcionesUbicacion = [
    "Almacén sótano 5",
    "Centro de Distribución y Logística Principal (Lurín)",
    "Base Operativa Norte (San Martín de Porres)",
    "Unidad Móvil de Emergencias (Vehículo Táctico)",
    "Laboratorio de Calibración y Mantenimiento"
];
const opcionesMovimiento = ["Ingreso", "Salida"];

export const Formulario = () => {
    const [data, setData] = useState({
        nombre: "",
        apellido: "",
        equipo: opcionesEquipo[0],
        ubicacion: opcionesUbicacion[0],
        observacion: "",
        movimiento: opcionesMovimiento[1]
    });



    const handleChange = (e) => {
        // Al usar radio buttons, volvemos a leer simplemente name y value
        const { name, value } = e.target;

        setData({
            ...data,
            [name]: value
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (data.nombre === "" || data.apellido === "" || data.equipo === "" || data.ubicacion === "") {
            alert("Faltan datos");
            console.log("Faltan datos");
        } else {
            const urlGoogleAppsScript = "https://script.google.com/macros/s/AKfycbxxC475VDMbyw74GbWqLYm8x2FIFPi-OuQujPDO59VR9EcIz3LH8ZH52MwKgARGvsJ9/exec";

            try {
                await fetch(urlGoogleAppsScript, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                    mode: "no-cors"
                });
                console.log("Datos enviados correctamente");

                setData({ nombre: "", apellido: "", equipo: opcionesEquipo[0], ubicacion: opcionesMovimiento[0], movimiento: opcionesMovimiento[1] });
            } catch (error) {
                console.error("Error al enviar los datos:", error);
            }
        }
    };

    return (
        <form className="formulario-equipos" onSubmit={handleSubmit}>
            <TextInput name="nombre" id="input-nombre" value={data.nombre} onChange={handleChange} placeholder="Nombre">Nombre: </TextInput>
            <TextInput name="apellido" id="input-apellido" value={data.apellido} onChange={handleChange} placeholder="Apellido">Apellido: </TextInput>
            <SelectInput name="equipo" value={data.equipo} onChange={handleChange} opciones={opcionesEquipo}>Equipo: </SelectInput>
            <SelectInput name="ubicacion" value={data.ubicacion} onChange={handleChange} opciones={opcionesUbicacion}>Ubicación: </SelectInput>
            <TextInput name="observacion" id="observacion" value={data.observacion} onChange={handleChange} placeholder="observacion">Observacion: </TextInput>
            <RadioButton name="movimiento" value={data.movimiento} onChange={handleChange} opciones={opcionesMovimiento}>Movimiento: </RadioButton>
            <BotonFormulario className="boton-formulario">Enviar</BotonFormulario>
        </form>
    );
}