import './SelectInput.css';

export const SelectInput = ({ children, name, value, onChange, opciones }) => {
    return (
        <div className="select-input-container">
            <label htmlFor={name} className="select-label">{children}</label>
            <div className="select-wrapper">
                <select name={name} id={name} className="select-control" value={value} onChange={onChange}>
                    <option value="" disabled>Seleccione...</option>

                    {opciones.map((opcion, index) => {
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
        </div>
    );
};