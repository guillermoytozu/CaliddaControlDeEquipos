const Boton = ({ texto = "Default" }) => {
    return (
        <button>
            <img src="https://purina.com.pe/sites/default/files/2022-10/Que_debes_saber_antes_de_adoptar_un_gatito.jpg" />
            {texto}
        </button>
    );
}

export default Boton;