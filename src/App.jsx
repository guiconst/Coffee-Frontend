import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Admin from './pages/Admin'
import Cardapio from './pages/Cardapio'
import Detalhes from './pages/Detalhes'

export default function App() {
  return (
    <HashRouter>
      <div className="bg-background text-on-background antialiased min-h-screen flex flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/cardapio" replace />} />
          <Route path="/cardapio" element={<Cardapio />} />
          <Route path="/detalhes/:id" element={<Detalhes />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/cardapio" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
