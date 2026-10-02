import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function fmt(val) {
  return `R$ ${parseFloat(val).toFixed(2).replace('.', ',')}`
}

const TAG_MAP = {
  destaque: ['Destaque', 'bg-tertiary text-on-tertiary'],
  novo: ['Novo', 'bg-secondary-container text-on-secondary-container'],
  promocao: ['Promoção', 'bg-error text-on-error'],
}

function ProductCard({ p }) {
  const badges = (p.tags || []).filter((t) => TAG_MAP[t])

  return (
    <Link
      to={`/detalhes/${p.id}`}
      className="bg-surface rounded-xl flex flex-col group hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/10 relative h-full"
    >
      <div className="w-full h-56 rounded-t-xl overflow-hidden shrink-0 relative">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          src={p.image_url || ''}
          alt={p.name}
          loading="lazy"
        />
        {badges.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {badges.map((t) => {
              const [label, cls] = TAG_MAP[t]
              return (
                <span
                  key={t}
                  className={`${cls} font-label-sm text-label-sm px-2.5 py-0.5 rounded-full`}
                >
                  {label}
                </span>
              )
            })}
          </div>
        )}
      </div>
      <div className="flex flex-col flex-grow p-5">
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className="font-headline-md text-headline-md text-primary text-xl leading-tight">
            {p.name}
          </h3>
          <span className="font-label-md text-label-md text-secondary font-bold whitespace-nowrap shrink-0">
            {fmt(p.price)}
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant mb-5 flex-grow line-clamp-2">
          {p.description}
        </p>
        <div className="w-full border border-primary text-primary px-4 py-3 rounded-full font-label-md text-label-md flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-on-primary transition-colors">
          Ver Detalhes
        </div>
      </div>
    </Link>
  )
}

export default function Cardapio() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    async function buscarDados() {
      setLoading(true)
      setErrorMsg(null)

      const { data, error } = await supabase.from('products').select('*')

      if (error) {
        console.error('Erro ao buscar produtos no Supabase:', error)
        setErrorMsg(error.message)
      } else {
        setProducts(data || [])
      }

      setLoading(false)
    }

    buscarDados()

    // Realtime: o cardápio acompanha mudanças feitas no Admin
    const channel = supabase
      .channel('cardapio-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts((prev) => (prev.some((p) => p.id === payload.new.id) ? prev : [...prev, payload.new]))
        } else if (payload.eventType === 'UPDATE') {
          setProducts((prev) => prev.map((p) => (p.id === payload.new.id ? payload.new : p)))
        } else if (payload.eventType === 'DELETE') {
          setProducts((prev) => prev.filter((p) => p.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <main className="flex-grow pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-[1200px] mx-auto w-full">
      <header className="mb-12 text-center md:text-left">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4">
          Nosso Cardápio
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Descubra nossa seleção artesanal de cafés especiais, bebidas geladas
          refrescantes e acompanhamentos preparados diariamente com
          ingredientes selecionados.
        </p>
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body-md text-on-surface-variant">
            Carregando produtos...
          </p>
        </div>
      )}

      {!loading && errorMsg && (
        <div className="text-center py-16">
          <p className="font-body-md text-on-surface-variant">
            Não foi possível carregar o cardápio: {errorMsg}
          </p>
        </div>
      )}

      {!loading && !errorMsg && products.length === 0 && (
        <div className="text-center py-16">
          <p className="font-body-md text-on-surface-variant">
            Nenhum produto encontrado na tabela "products".
          </p>
        </div>
      )}

      {!loading && !errorMsg && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </main>
  )
}
