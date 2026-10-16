import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, loading, loginComGoogle } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/cardapio" replace />

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-margin-mobile bg-background text-on-background">
      <div className="text-center">
        <h1 className="font-display text-headline-lg-mobile md:text-headline-lg text-primary">
          Constantino Coffee
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Entre com sua conta Google para ver o cardápio.
        </p>
      </div>

      <button
        onClick={loginComGoogle}
        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm font-label-md text-label-md font-semibold text-on-surface hover:border-primary transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/>
          <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/>
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
        </svg>
        Entrar com Google
      </button>
    </main>
  )
}
