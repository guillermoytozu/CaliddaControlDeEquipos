import { useState } from "react";

const Boton = ({ children, avatar }) => {
    const [booleano, interruptor] = useState(false)

    const texto = booleano ? 'verdadero' : 'falso'
    const buttonClassName = booleano ? 'boton-css1 boton-css2' : 'boton-css1'

    const activarInterruptor = () => { interruptor(!booleano) }

    return (
        <button className={buttonClassName} onClick={activarInterruptor}>
            <img alt="Avatar" src={`https://unavatar.io/github/${avatar}`} />
            <img alt="poke" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png`} />
            {children}
            <br />
            {texto}
        </button>
    );
}

export default Boton;