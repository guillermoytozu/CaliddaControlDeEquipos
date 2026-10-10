import { useState } from "react";

export const TextInput = ({ children, placeholder, name, value, onChange }) => {
    return (
        <>
            <label>{children}</label>
            <input
                type="text"
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />

        </>
    );

}
