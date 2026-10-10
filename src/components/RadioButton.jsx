/* export const RadioButton = ({ children, name, value, onChange, opciones }) => {
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
 */
export const RadioButton = ({ children, name, value, onChange, opciones }) => {
    return (
        <>
            <span className="titulo-grupo">{children}</span>

            <div className="radio-button">
                {opciones.map((opcion, index) => {
                    // Generamos un ID único combinando el name ("movimiento") y el índice
                    const idUnico = `${name}-${index}`;

                    return (
                        <div key={index}>
                            <input
                                type="radio"
                                id={idUnico}            // 1. Asignamos el ID al input
                                name={name}
                                value={opcion}
                                checked={value === opcion}
                                onChange={onChange}
                            />
                            {/* 2. Envolvemos el texto en un label con htmlFor */}
                            <label htmlFor={idUnico}>
                                {opcion}
                            </label>
                        </div>
                    );
                })}
            </div>
        </>
    );
}