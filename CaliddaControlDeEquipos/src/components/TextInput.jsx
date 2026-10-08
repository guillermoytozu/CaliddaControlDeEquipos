import { useState } from "react";

export const TextInput = ({ children, placeholder }) => {
    return (
        <>
            <label>{children}</label>
            <input type="text" placeholder={placeholder} />

        </>
    );

}
