import { Formulario } from './components/Formulario'
import { useState } from 'react'
import { Navegacion } from './components/Navegacion';

function App() {
  return (
    <>
      <Navegacion>
        <li><a id="Link-inicio" href="#">Inicio</a></li>
        <li><a id="Link-fotos" href="#">Inventario</a></li>
      </Navegacion>
      <Formulario></Formulario>

    </>
  );
}

export default App
