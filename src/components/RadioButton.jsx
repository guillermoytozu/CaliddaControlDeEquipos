import './RadioButton.css';

export const RadioButton = ({ children, name, value, onChange, opciones }) => {
    return (
        <div className="radio-group-container">
            <span className="titulo-grupo">{children}</span>

            <div className="radio-button">
                {opciones.map((opcion, index) => {
                    const idUnico = `${name}-${index}`;
                    const esObjeto = typeof opcion === 'object' && opcion !== null;
                    const valorOpcion = esObjeto ? opcion.value : opcion;
                    const etiquetaOpcion = esObjeto ? opcion.label : opcion;
                    const isChecked = value === valorOpcion;

                    return (
                        <label
                            key={index}
                            htmlFor={idUnico}
                            className={`radio-card ${isChecked ? 'seleccionado' : ''}`}
                        >
                            <input
                                type="radio"
                                id={idUnico}
                                name={name}
                                value={valorOpcion}
                                checked={isChecked}
                                onChange={onChange}
                                className="radio-input-native"
                            />
                            <span className="radio-custom-indicator"></span>
                            <span className="radio-label-text">
                                {etiquetaOpcion}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};