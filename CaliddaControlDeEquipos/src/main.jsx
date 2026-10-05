import React, { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Boton from './components/Boton.jsx'
import App from './App.jsx'


const root = createRoot(document.getElementById('root'));

root.render(
  <React.Fragment>
    <Boton texto="boton1" />
    <Boton texto="boton2" />
    <Boton />
  </React.Fragment>
)
