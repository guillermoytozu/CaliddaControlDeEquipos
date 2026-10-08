import { PaginaInicio } from './pages/paginaInicio';
import { Footer } from './components/Footer';
import { Navegacion } from './components/Navegacion';
import { Tabla } from './components/Tabla';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Navegacion />

      <Routes>
        <Route path="/inicio" element={<PaginaInicio />} />
        <Route path="/inventario" element={<h1>Por desarrollar</h1>} />
      </Routes>

      <Footer año="2026">
        Calidda - Derechos reservados
      </Footer>
    </BrowserRouter>
  );
}

export default App;
