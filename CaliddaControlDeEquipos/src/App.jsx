import Boton from './components/Boton.jsx'
import { useState } from 'react'

function App() {
  return (
    <>
      <Boton avatar="guillermoytozu" booleano={true}>Botoncito</Boton>
      <Boton avatar="plus" >Botoncito</Boton>
    </>
  )
}

export default App
