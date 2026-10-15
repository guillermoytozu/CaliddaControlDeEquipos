import { Footer } from './components/Footer';
import { Navegacion } from './components/Navegacion';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PaginaInicio } from './pages/paginaInicio';
import { PaginaInventario } from './pages/PaginaInventario';
import { PaginaLogin } from './pages/paginaLogin';
import { AuthProvider } from './context/AuthContext';
import logoCalidda from './IMG/logo.png';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.DEV ? '/' : '/CaliddaControlDeEquipos/'}>
        <div className="app-container">
          <header id="header" className="app-header">
            <div className="header-content">
              <img src={logoCalidda} alt="Logo Cálidda" className="header-logo" />
              <h1 id="titulo" className="header-titulo">CONTROL DE EQUIPOS <br /> CÁLIDDA</h1>
            </div>
          </header>
          <Navegacion />
          <main className="app-main-content">
            <Routes>
              <Route path="/login" element={<PaginaLogin />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/inicio" element={<PaginaInicio />} />
              <Route path="/inventario" element={<PaginaInventario />} />
            </Routes>
          </main>
          <Footer año="2026">
            Calidda - Derechos reservados
          </Footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;