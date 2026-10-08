import { useState } from "react";

export const BotonFormulario = ({ children, className }) => {

    return (
        <button className={className}>
            {children}
        </button>
    );
}
