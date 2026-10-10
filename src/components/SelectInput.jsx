export const SelectInput = ({ children, name, value, onChange, opciones }) => {
    return (
        <>
            <label>{children}</label>
            <select name={name} value={value} onChange={onChange}>
                <option value="" disabled>Seleccione una opción...</option>
                {opciones.map((opcion, index) => (
                    <option key={index} value={opcion}>{opcion}</option>
                ))}
            </select>
        </>
    );
}