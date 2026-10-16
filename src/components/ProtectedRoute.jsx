import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  // Espera checar a sessão antes de decidir (evita redirecionar à toa)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant font-body-md text-body-md">
        Carregando...
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
