import './SelectInput.css';

// 1. Agregamos 'disabled' a los parámetros que recibe el componente
export const SelectInput = ({
    children,
    name,
    value,
    onChange,
    opciones,
    disabled,
    placeholder = "Seleccione...",
    mostrarObservaciones = false,
    labelObservaciones = "Observaciones (Opcional):",
    observaciones = "",
    onObservacionesChange,
    placeholderObservaciones = "Observaciones de este equipo (Opcional)",
    nameObservaciones,
    mostrarBotonAgregar = false,
    onAgregar,
    disabledAgregar = false,
    tooltipAgregar = "Agregar otro equipo",
    mostrarBotonEliminar = false,
    onEliminar,
    tooltipEliminar = "Eliminar este equipo"
}) => {
    return (
        <div className={`select-input-container ${mostrarObservaciones ? 'select-input-con-observaciones' : ''}`}>
            <label htmlFor={name} className="select-label">{children}</label>

            <div className="select-row-wrapper">
                <div className="select-wrapper">
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

                {(mostrarBotonAgregar || mostrarBotonEliminar) && (
                    <div className="select-acciones">
                        {mostrarBotonAgregar && (
                            <button
                                type="button"
                                className="btn-select-accion btn-select-agregar"
                                onClick={onAgregar}
                                disabled={disabledAgregar}
                                title={tooltipAgregar}
                                aria-label="Agregar otro equipo"
                            >
                                +
                            </button>
                        )}

                        {mostrarBotonEliminar && (
                            <button
                                type="button"
                                className="btn-select-accion btn-select-eliminar"
                                onClick={onEliminar}
                                title={tooltipEliminar}
                                aria-label="Eliminar este equipo"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}
            </div>

            {mostrarObservaciones && (
                <div className="select-observaciones-container">
                    {labelObservaciones && (
                        <label
                            htmlFor={nameObservaciones || `${name}_observaciones`}
                            className="select-observaciones-label"
                        >
                            {labelObservaciones}
                        </label>
                    )}
                    <input
                        type="text"
                        id={nameObservaciones || `${name}_observaciones`}
                        name={nameObservaciones || `${name}_observaciones`}
                        className="select-observaciones-field"
                        value={observaciones}
                        onChange={onObservacionesChange}
                        placeholder={placeholderObservaciones}
                        disabled={disabled}
                    />
                </div>
            )}
        </div>
    );
};