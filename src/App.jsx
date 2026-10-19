import { Footer } from "./components/Footer";
import { Navegacion } from "./components/Navegacion";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PaginaLogin } from "./pages/paginaLogin";
import { PaginaRegistro } from "./pages/PaginaRegistro";
import { PaginaTrazabilidad } from "./pages/PaginaTrazabilidad";
import { PaginaInventario } from "./pages/PaginaInventario";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RutaProtegida } from "./components/RutaProtegida";
import { RutaPublica } from "./components/RutaPublica";
import logoCalidda from "./IMG/LogoCalidda.svg";
import "./App.css";

function AppContent() {
  const { user, loading } = useAuth();

  return (
    <div className="app-container">
      {/* El header solo se muestra cuando NO hay sesión (pantalla de login) */}
      {!loading && !user && (
        <header id="header" className="app-header">
          <div className="header-content">
            <img src={logoCalidda} alt="Logo Cálidda" className="header-logo" />
            <span id="titulo" className="header-titulo">
              CONTROL DE EQUIPOS
            </span>
          </div>
        </header>
      )}
      {/* La barra de navegación sólo se muestra cuando el usuario está autenticado */}
      {!loading && user && <Navegacion />}

      <main className="app-main-content">
        {loading ? (
          <div className="auth-loading-screen" role="status" aria-live="polite">
            <div className="auth-loading-spinner" />
            <p className="auth-loading-text">Verificando sesión...</p>
          </div>
        ) : (
          <Routes>
            {/* Rutas Públicas (redirigen a /registro si el usuario ya inició sesión) */}
            <Route element={<RutaPublica />}>
              <Route path="/login" element={<PaginaLogin />} />
            </Route>

            {/* Rutas Protegidas (redirigen a /login si no hay sesión activa) */}
            <Route element={<RutaProtegida />}>
              <Route path="/registro" element={<PaginaRegistro />} />
              <Route path="/trazabilidad" element={<PaginaTrazabilidad />} />
              <Route path="/inventario" element={<PaginaInventario />} />
            </Route>

            {/* Redirección por defecto para ruta raíz y rutas desconocidas */}
            <Route
              path="/"
              element={<Navigate to={user ? "/registro" : "/login"} replace />}
            />
            <Route
              path="*"
              element={<Navigate to={user ? "/registro" : "/login"} replace />}
            />
          </Routes>
        )}
      </main>

      <Footer año="2026">Calidda - Derechos reservados</Footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
