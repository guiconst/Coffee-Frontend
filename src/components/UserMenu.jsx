import { useAuth } from '../context/AuthContext'

export default function UserMenu() {
  const { user, sair } = useAuth()
  if (!user) return null

  const { full_name, avatar_url } = user.user_metadata ?? {}

  return (
    <div className="flex items-center gap-3">
      {avatar_url && (
        <img
          src={avatar_url}
          alt={full_name ?? 'Foto de perfil'}
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-full object-cover border border-outline-variant"
        />
      )}
      <div className="hidden md:block leading-tight">
        <p className="font-label-md text-label-md font-semibold text-on-surface">
          {full_name ?? 'Usuário'}
        </p>
        <p className="font-body-md text-label-sm text-on-surface-variant">{user.email}</p>
      </div>
      <button
        onClick={sair}
        className="font-label-md text-label-md px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
      >
        Sair
      </button>
    </div>
  )
}
