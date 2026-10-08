import { Formulario } from './components/Formulario'
import { Footer } from './components/Footer';
import { Navegacion } from './components/Navegacion';
import { Tabla } from './components/Tabla';
import { useState } from 'react'

function App() {
  return (
    <>
      <Navegacion>
        <li><a id="Link-inicio" href="#">Inicio</a></li>
        <li><a id="Link-fotos" href="#">Inventario</a></li>
      </Navegacion>
      <Formulario></Formulario>
      <Tabla></Tabla>
      <Footer año="2026">
        Calidda - Derechos reservados
      </Footer>
    </>
  );
}

export default App
