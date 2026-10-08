export const RadioButton = ({ children, name, value, onChange, opciones }) => {
    return (
        <>
            <label>{children}</label>
            <div className="radio-button">
                {opciones.map((opcion, index) => (
                    <div key={index} >
                        <input
                            type="radio"
                            name={name}
                            value={opcion}
                            checked={value === opcion}
                            onChange={onChange}
                        />
                        {opcion}
                    </div>
                ))}
            </div>
        </>
    );
}