import { useState } from "react";

export const Footer = ({ children, año }) => {
    return (
        <>
            <footer>
                <p>{children}</p>
                <p>{año}</p>
            </footer>

        </>
    );

}
