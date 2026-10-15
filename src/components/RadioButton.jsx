export const RadioButton = ({ children, name, value, onChange, opciones }) => {
    return (
        <>
            <span className="titulo-grupo">{children}</span>

            <div className="radio-button">
                {opciones.map((opcion, index) => {
                    const idUnico = `${name}-${index}`;

                    // 1. Detectamos si la opción es un objeto o un string simple
                    const esObjeto = typeof opcion === 'object' && opcion !== null;
                    const valorOpcion = esObjeto ? opcion.value : opcion;
                    const etiquetaOpcion = esObjeto ? opcion.label : opcion;

                    return (
                        <div key={index}>
                            <input
                                type="radio"
                                id={idUnico}
                                name={name}
                                // 2. Usamos el valor extraído
                                value={valorOpcion}
                                // 3. Comparamos contra el valor extraído
                                checked={value === valorOpcion}
                                onChange={onChange}
                            />
                            <label htmlFor={idUnico}>
                                {/* 4. Mostramos la etiqueta extraída */}
                                {etiquetaOpcion}
                            </label>
                        </div>
                    );
                })}
            </div>
        </>
    );
}