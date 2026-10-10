import { TextInput } from "./TextInput";
import { SelectInput } from "./SelectInput";
import { RadioButton } from "./RadioButton";
import { BotonFormulario } from "./BotonFormulario";
import { useState } from "react";


const opcionesEquipo = ["Radio detection", "Multímetro", "Taladro", "Grua excavadora"];
const opcionesUbicacion = ["Almacén sótano 1", "Almacén sótano 2", "Almacén sótano 3"];
const opcionesMovimiento = ["Ingreso", "Salida"];

export const Formulario = () => {
    const [data, setData] = useState({
        nombre: "",
        apellido: "",
        equipo: "",
        ubicacion: "",
        movimiento: "Salida"
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

                setData({ nombre: "", apellido: "", equipo: "", ubicacion: "", movimiento: "Salida" });
            } catch (error) {
                console.error("Error al enviar los datos:", error);
            }
        }
    };

    return (
        <form className="formulario-equipos" onSubmit={handleSubmit}>
            <TextInput name="nombre" value={data.nombre} onChange={handleChange} placeholder="Nombre">Nombre: </TextInput>
            <TextInput name="apellido" value={data.apellido} onChange={handleChange} placeholder="Apellido">Apellido: </TextInput>
            <SelectInput name="equipo" value={data.equipo} onChange={handleChange} opciones={opcionesEquipo}>Equipo: </SelectInput>
            <SelectInput name="ubicacion" value={data.ubicacion} onChange={handleChange} opciones={opcionesUbicacion}>Ubicación: </SelectInput>
            <RadioButton name="movimiento" value={data.movimiento} onChange={handleChange} opciones={opcionesMovimiento}>Movimiento: </RadioButton>
            <BotonFormulario className="boton-formulario">Enviar</BotonFormulario>
        </form>
    );
}