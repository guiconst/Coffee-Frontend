import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Admin from './pages/Admin'
import Cardapio from './pages/Cardapio'
import Detalhes from './pages/Detalhes'
import Login from './pages/Login'

// Layout das telas internas: Navbar + conteúdo da rota
function LayoutPrivado() {
  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col">
      <Navbar />
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Pública (sem Navbar) */}
          <Route path="/login" element={<Login />} />

          {/* Protegidas: só entra logado */}
          <Route element={<ProtectedRoute />}>
            <Route element={<LayoutPrivado />}>
              <Route path="/cardapio" element={<Cardapio />} />
              <Route path="/detalhes/:id" element={<Detalhes />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/cardapio" replace />} />
          <Route path="*" element={<Navigate to="/cardapio" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
