import { Footer } from './components/Footer';
import { Navegacion } from './components/Navegacion';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PaginaInicio } from './pages/paginaInicio';
import { PaginaInventario } from './pages/PaginaInventario';

function App() {
  return (
    <BrowserRouter>
      <Navegacion />

      <Routes>
        <Route path="/inicio" element={<PaginaInicio />} />
        <Route path="/inventario" element={<PaginaInventario />} />
      </Routes>

      <Footer año="2026">
        Calidda - Derechos reservados
      </Footer>
    </BrowserRouter>
  );
}

export default App;
