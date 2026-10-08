import { useState } from "react";

export const BotonFormulario = ({ children, className }) => {

    return (
        <button
            type="submit"
            className={className}>
            {children}
        </button>
    );
}
