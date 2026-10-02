import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function fmt(val) {
  return `R$ ${parseFloat(val).toFixed(2).replace('.', ',')}`
}

export default function Detalhes() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    async function buscar() {
      setLoading(true)
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
      if (error) setErrorMsg(error.message)
      else if (!data) setErrorMsg('Produto não encontrado.')
      else setProduct(data)
      setLoading(false)
    }
    buscar()
  }, [id])

  return (
    <main className="flex-grow pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-[1000px] mx-auto w-full">
      <Link to="/cardapio" className="font-label-md text-label-md text-primary hover:underline">
        Voltar ao cardápio
      </Link>

      {loading && <p className="font-body-md text-on-surface-variant mt-8">Carregando...</p>}
      {!loading && errorMsg && <p className="font-body-md text-error mt-8">{errorMsg}</p>}

      {!loading && product && (
        <div className="grid md:grid-cols-2 gap-lg mt-8 items-start">
          <div className="rounded-xl overflow-hidden bg-surface-container aspect-square">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
              {product.name}
            </h1>
            <p className="font-headline-md text-headline-md text-secondary">{fmt(product.price)}</p>
            <p className="font-body-lg text-body-lg text-on-surface-variant">{product.description}</p>
          </div>
        </div>
      )}
    </main>
  )
}
