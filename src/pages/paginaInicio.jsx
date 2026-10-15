import { Formulario } from "../components/Formulario";
import { TablaMovimientos } from "../components/TablaMovimientos";
import './paginaInicio.css';

export const PaginaInicio = () => {
    return (
        <div className="pagina-inicio">
            <Formulario />
            <TablaMovimientos />
        </div>
    );
};
