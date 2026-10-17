import './SelectInput.css';

// 1. Agregamos 'disabled' a los parámetros que recibe el componente
export const SelectInput = ({ children, name, value, onChange, opciones, disabled, placeholder = "Seleccione..." }) => {
    return (
        <div className="select-input-container">
            <label htmlFor={name} className="select-label">{children}</label>
            <div className="select-wrapper">
                {/* 2. Le pasamos la propiedad disabled a la etiqueta select */}
                <select
                    name={name}
                    id={name}
                    className="select-control"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                >
                    <option value="" disabled>{placeholder}</option>

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