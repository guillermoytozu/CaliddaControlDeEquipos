export const SelectInput = ({ children, name, value, onChange, opciones }) => {
    return (
        <div className="select-input-container">
            <label htmlFor={name}>{children}</label>
            <select name={name} id={name} value={value} onChange={onChange}>
                <option value="" disabled>Seleccione...</option>

                {opciones.map((opcion, index) => {
                    // Detectamos si la opción es un objeto con {value, label} o un string simple
                    const esObjeto = typeof opcion === 'object' && opcion !== null;
                    const valorOpcion = esObjeto ? opcion.value : opcion;
                    const etiquetaOpcion = esObjeto ? opcion.label : opcion;

                    return (
                        <option key={index} value={valorOpcion}>
                            {etiquetaOpcion}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};