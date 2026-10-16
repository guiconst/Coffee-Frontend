import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const traduzErro = (msg = '') => {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (m.includes('already registered')) return 'Este e-mail já está cadastrado.'
  if (m.includes('at least 6')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('valid email') || m.includes('invalid format')) return 'Digite um e-mail válido.'
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  return msg || 'Algo deu errado. Tente novamente.'
}

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary'

export default function Login() {
  const { user, loading, loginComGoogle, entrar, cadastrar } = useAuth()

  const [modo, setModo] = useState('login') // 'login' | 'cadastro'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/cardapio" replace />

  const trocarModo = (novo) => {
    setModo(novo)
    setErro('')
    setAviso('')
    setPassword('')
    setConfirmar('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setAviso('')

    if (modo === 'cadastro') {
      if (password.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
      if (password !== confirmar) return setErro('As senhas não conferem.')
    }

    setEnviando(true)
    try {
      if (modo === 'login') {
        const { error } = await entrar(email.trim(), password)
        if (error) setErro(traduzErro(error.message))
        // sucesso: o onAuthStateChange atualiza o user e a tela redireciona sozinha
      } else {
        const { data, error } = await cadastrar(email.trim(), password)
        if (error) {
          setErro(traduzErro(error.message))
        } else if (!data.session) {
          // Supabase exige confirmação de e-mail
          setAviso('Conta criada! Enviamos um link de confirmação para o seu e-mail.')
          setModo('login')
          setPassword('')
          setConfirmar('')
        }
      }
    } catch (err) {
      console.error(err)
      setErro('Não foi possível conectar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-margin-mobile py-10 bg-background text-on-background">
      <div className="text-center">
        <h1 className="font-display text-headline-lg-mobile md:text-headline-lg text-primary">
          Constantino Coffee
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          {modo === 'login' ? 'Entre para ver o cardápio.' : 'Crie sua conta para começar.'}
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-5">
        {/* Abas */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-container">
          {[
            ['login', 'Entrar'],
            ['cadastro', 'Criar conta'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => trocarModo(id)}
              className={`py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors ${
                modo === id
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Formulário e-mail e senha */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          {modo === 'cadastro' && (
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Confirmar senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className={inputCls}
            />
          )}

          {erro && (
            <p role="alert" className="px-4 py-2 rounded-lg bg-error-container text-on-error-container font-label-md text-label-md">
              {erro}
            </p>
          )}
          {aviso && (
            <p role="status" className="px-4 py-2 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md">
              {aviso}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors disabled:opacity-60"
          >
            {enviando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center gap-3 text-outline">
          <span className="flex-1 h-px bg-outline-variant" />
          <span className="font-label-md text-label-sm">ou</span>
          <span className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={loginComGoogle}
          className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm font-label-md text-label-md font-semibold text-on-surface hover:border-primary transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/>
            <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/>
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
          </svg>
          Continuar com Google
        </button>
      </div>
    </main>
  )
}
