import { useState } from "react";

export const Navegacion = ({ children }) => {
    return (
        <nav>
            <ul class="lista-Nav">
                {children}
            </ul>
        </nav>
    );

}
