import { useState, useRef, useEffect, useMemo } from 'react';
import './SelectInput.css';

const normalizar = (texto) =>
    String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

export const SelectInput = ({
    children,
    name,
    value,
    onChange,
    opciones = [],
    disabled,
    placeholder = "Seleccione...",
    mostrarEstado = false,
    labelEstado = "Estado:",
    estado = "",
    onEstadoChange,
    opcionesEstado = [],
    placeholderEstado = "Estado...",
    nameEstado,
    idEstado,
    mostrarObservaciones = false,
    labelObservaciones = "Observaciones (Opcional):",
    observaciones = "",
    onObservacionesChange,
    placeholderObservaciones = "Observaciones de este equipo (Opcional)",
    nameObservaciones,
    idObservaciones,
    mostrarBotonAgregar = false,
    onAgregar,
    disabledAgregar = false,
    tooltipAgregar = "Agregar otro equipo",
    mostrarBotonEliminar = false,
    onEliminar,
    tooltipEliminar = "Eliminar este equipo"
}) => {
    const contenedorRef = useRef(null);
    const inputRef = useRef(null);

    const opcionSeleccionada = useMemo(() => {
        return opciones.find((op) => {
            const val = typeof op === 'object' && op !== null ? op.value : op;
            return String(val) === String(value);
        });
    }, [opciones, value]);

    const labelSeleccionado = useMemo(() => {
        if (!opcionSeleccionada) return '';
        return typeof opcionSeleccionada === 'object' && opcionSeleccionada !== null
            ? opcionSeleccionada.label
            : String(opcionSeleccionada);
    }, [opcionSeleccionada]);

    const [prevLabel, setPrevLabel] = useState(labelSeleccionado);
    const [textoInput, setTextoInput] = useState(labelSeleccionado);
    const [abierto, setAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [indiceResaltado, setIndiceResaltado] = useState(-1);

    // Ajuste reactivo al cambiar la opción seleccionada sin disparar efecto
    if (prevLabel !== labelSeleccionado) {
        setPrevLabel(labelSeleccionado);
        setTextoInput(labelSeleccionado);
        if (!abierto) {
            setBusqueda('');
            setIndiceResaltado(-1);
        }
    }

    useEffect(() => {
        const handleClickAfuera = (event) => {
            if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
                setAbierto(false);
                setTextoInput(labelSeleccionado);
                setBusqueda('');
                setIndiceResaltado(-1);
            }
        };

        document.addEventListener('mousedown', handleClickAfuera);
        return () => {
            document.removeEventListener('mousedown', handleClickAfuera);
        };
    }, [labelSeleccionado]);

    const opcionesFiltradas = useMemo(() => {
        if (!busqueda.trim()) return opciones;
        const busqNorm = normalizar(busqueda);
        return opciones.filter((op) => {
            const etiqueta = typeof op === 'object' && op !== null ? op.label : String(op);
            return normalizar(etiqueta).includes(busqNorm);
        });
    }, [opciones, busqueda]);

    const seleccionarOpcion = (valorOpcion) => {
        onChange({ target: { name, value: valorOpcion } });
        setAbierto(false);
        setBusqueda('');
        setIndiceResaltado(-1);
    };

    const handleInputChange = (e) => {
        const texto = e.target.value;
        setTextoInput(texto);
        setBusqueda(texto);
        setIndiceResaltado(0);
        if (!abierto) setAbierto(true);
    };

    const handleInputFocus = () => {
        if (disabled) return;
        setAbierto(true);
        if (inputRef.current) {
            inputRef.current.select();
        }
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!abierto) {
                setAbierto(true);
                return;
            }
            setIndiceResaltado((prev) =>
                prev < opcionesFiltradas.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!abierto) {
                setAbierto(true);
                return;
            }
            setIndiceResaltado((prev) =>
                prev > 0 ? prev - 1 : opcionesFiltradas.length - 1
            );
        } else if (e.key === 'Enter') {
            if (abierto && opcionesFiltradas.length > 0) {
                e.preventDefault();
                const idx = indiceResaltado >= 0 && indiceResaltado < opcionesFiltradas.length
                    ? indiceResaltado
                    : 0;
                const op = opcionesFiltradas[idx];
                const val = typeof op === 'object' && op !== null ? op.value : op;
                seleccionarOpcion(val);
            }
        } else if (e.key === 'Escape') {
            setAbierto(false);
            setTextoInput(labelSeleccionado);
            setBusqueda('');
            setIndiceResaltado(-1);
        }
    };

    return (
        <div className={`select-input-container ${(mostrarObservaciones || mostrarEstado) ? 'select-input-con-observaciones' : ''}`}>
            <label htmlFor={name} className="select-label">{children}</label>

            <div className="select-row-wrapper">
                <div
                    className={`select-wrapper select-buscable-wrapper ${abierto ? 'abierto' : ''}`}
                    ref={contenedorRef}
                >
                    <div className="select-buscable-control-wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            name={name}
                            id={name}
                            className="select-control select-buscable-input"
                            value={textoInput}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled}
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            className={`select-buscable-chevron ${abierto ? 'abierto' : ''}`}
                            onClick={() => {
                                if (disabled) return;
                                setAbierto((prev) => !prev);
                                if (!abierto && inputRef.current) {
                                    inputRef.current.focus();
                                }
                            }}
                            disabled={disabled}
                            aria-label="Desplegar opciones"
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    </div>

                    {abierto && !disabled && (
                        <ul className="select-buscable-dropdown" role="listbox">
                            {opcionesFiltradas.length > 0 ? (
                                opcionesFiltradas.map((opcion, index) => {
                                    const esObjeto = typeof opcion === 'object' && opcion !== null;
                                    const valorOpcion = esObjeto ? opcion.value : opcion;
                                    const etiquetaOpcion = esObjeto ? opcion.label : opcion;
                                    const esSeleccionado = String(valorOpcion) === String(value);

                                    return (
                                        <li
                                            key={index}
                                            role="option"
                                            aria-selected={esSeleccionado}
                                            className={`select-buscable-option ${esSeleccionado ? 'seleccionado' : ''} ${index === indiceResaltado ? 'resaltado' : ''}`}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                seleccionarOpcion(valorOpcion);
                                            }}
                                        >
                                            {etiquetaOpcion}
                                        </li>
                                    );
                                })
                            ) : (
                                <li className="select-buscable-option-vacia">
                                    No se encontraron coincidencias
                                </li>
                            )}
                        </ul>
                    )}
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

            {(mostrarEstado || mostrarObservaciones) && (
                <div className="select-detalles-row">
                    {mostrarEstado && (
                        <div className="select-estado-container">
                            {labelEstado && (
                                <label
                                    htmlFor={idEstado || `${name}_estado`}
                                    className="select-estado-label"
                                >
                                    {labelEstado}
                                </label>
                            )}
                            <div className="select-wrapper select-estado-wrapper">
                                <select
                                    id={idEstado || `${name}_estado`}
                                    name={nameEstado || `${name}_estado`}
                                    className="select-control select-estado-control"
                                    value={estado}
                                    onChange={onEstadoChange}
                                    disabled={disabled}
                                >
                                    {placeholderEstado && !estado && (
                                        <option value="" disabled>
                                            {placeholderEstado}
                                        </option>
                                    )}
                                    {opcionesEstado.map((opcion, index) => {
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
                    )}

                    {mostrarObservaciones && (
                        <div className="select-observaciones-container">
                            {labelObservaciones && (
                                <label
                                    htmlFor={idObservaciones || nameObservaciones || `${name}_observaciones`}
                                    className="select-observaciones-label"
                                >
                                    {labelObservaciones}
                                </label>
                            )}
                            <input
                                type="text"
                                id={idObservaciones || nameObservaciones || `${name}_observaciones`}
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
            )}
        </div>
    );
};