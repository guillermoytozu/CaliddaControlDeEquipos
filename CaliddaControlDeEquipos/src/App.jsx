import Boton from './components/Boton.jsx'
import { useState } from 'react'

function App() {
  return (
    <>
      <div className='div-de-botones'>
        <Boton avatar="guillermoytozu" booleano={true}>Botoncito</Boton>
        <Boton avatar="plus" >Botoncito</Boton>
        <Boton avatar="ultra" >Botoncito</Boton>
      </div>
    </>
  )
}

export default App
