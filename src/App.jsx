import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Cardapio from './pages/Cardapio'

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-background text-on-background antialiased min-h-screen flex flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/cardapio" replace />} />
          <Route path="/cardapio" element={<Cardapio />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
