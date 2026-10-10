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
                    const idUnico = `${name}-${index}`;

                    return (
                        <div key={index}>
                            <input
                                type="radio"
                                id={idUnico}
                                name={name}
                                value={opcion}
                                checked={value === opcion}
                                onChange={onChange}
                            />
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