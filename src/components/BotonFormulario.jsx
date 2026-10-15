import './BotonFormulario.css';

export const BotonFormulario = ({ children, className = '' }) => {
    return (
        <button
            type="submit"
            className={`boton-formulario ${className}`.trim()}>
            {children}
        </button>
    );
};
