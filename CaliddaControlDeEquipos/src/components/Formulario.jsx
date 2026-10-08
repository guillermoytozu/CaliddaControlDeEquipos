import { TextInput } from "./TextInput";
import { BotonFormulario } from "./BotonFormulario";


import { useState } from "react";

export const Formulario = ({ }) => {
    return (
        <form className="formulario-equipos">
            <TextInput placeholder={"Nombre"}>Nombre: </TextInput>
            <TextInput placeholder={"Apellido"}>Apellido: </TextInput>
            <TextInput placeholder={"Ej. Radio detection"}>Equipo: </TextInput>
            <TextInput placeholder={"Almacén sótano 5"}>Ubicación: </TextInput>
            <TextInput placeholder={"Ingreso / Salida"}>Movimiento: </TextInput>
            <BotonFormulario className="boton-formulario">Enviar</BotonFormulario>
        </form>
    );
}
