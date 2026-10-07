const Boton = ({ children, avatar }) => {
    return (
        <button>
            <img alt="Avatar" src={`https://unavatar.io/github/${avatar}`} />
            {children}
        </button>
    );
}

export default Boton;