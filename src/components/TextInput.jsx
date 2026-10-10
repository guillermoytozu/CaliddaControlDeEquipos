import { useState } from "react";

export const TextInput = ({ children, id, placeholder, name, value, onChange }) => {
    return (
        <>
            <label htmlFor={id}>{children}</label>
            <input
                id={id}
                type="text"
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />

        </>
    );

}
