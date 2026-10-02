import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()
  const cls = (path) =>
    `font-label-md text-label-md ${
      pathname.startsWith(path) ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'
    }`

  return (
    <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-md shadow-sm border-b border-surface-variant">
      <div className="flex justify-between items-center max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop h-20">
        <Link className="font-display text-headline-md text-primary shrink-0" to="/">
          Constantino Coffee
        </Link>
        <nav className="flex items-center gap-5 md:gap-gutter">
          <Link className={cls('/cardapio')} to="/cardapio">
            Cardápio
          </Link>
          <Link className={cls('/admin')} to="/admin">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
