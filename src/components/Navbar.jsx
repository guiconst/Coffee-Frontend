export default function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md shadow-sm border-b border-surface-variant">
      <div className="flex justify-between items-center max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop h-20">
        <a
          className="font-display text-headline-md text-primary shrink-0"
          href="/"
        >
          Constantino Coffee
        </a>
        <nav className="hidden md:flex items-center gap-gutter">
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="/">
            Início
          </a>
          <a className="font-label-md text-label-md text-primary" href="/cardapio">
            Cardápio
          </a>
        </nav>
      </div>
    </header>
  )
}
