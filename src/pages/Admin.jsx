import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const TAGS = [
  { value: 'destaque', label: 'Destaque' },
  { value: 'novo', label: 'Novo' },
  { value: 'promocao', label: 'Promoção' },
]

const EMPTY_FORM = { name: '', price: '', description: '', image_url: '', tags: [] }

function fmt(val) {
  return `R$ ${parseFloat(val).toFixed(2).replace('.', ',')}`
}

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary'

export default function Admin() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [toast, setToast] = useState(null)

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  // READ: busca inicial
  useEffect(() => {
    async function carregar() {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      if (error) setLoadError(error.message)
      else setProducts(data || [])
      setLoading(false)
    }
    carregar()
  }, [])

  // REALTIME: mudanças feitas em outro dispositivo/aba aparecem aqui
  useEffect(() => {
    const channel = supabase
      .channel('admin-products')
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

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }))
  }

  function startEdit(p) {
    setEditingId(p.id)
    setForm({
      name: p.name || '',
      price: String(p.price ?? '').replace('.', ','),
      description: p.description || '',
      image_url: p.image_url || '',
      tags: p.tags || [],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  // CREATE + UPDATE
  async function handleSubmit(e) {
    e.preventDefault()

    const price = parseFloat(String(form.price).replace(',', '.'))
    if (!form.name.trim()) return showToast('error', 'Informe o nome do produto.')
    if (Number.isNaN(price) || price < 0) return showToast('error', 'Informe um preço válido.')

    const payload = {
      name: form.name.trim(),
      price,
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      tags: form.tags,
    }

    setSaving(true)

    if (editingId) {
      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingId)
        .select()

      if (error) {
        showToast('error', `Erro ao atualizar: ${error.message}`)
      } else if (!data || data.length === 0) {
        showToast('error', 'Nada foi atualizado. Verifique as policies (RLS) da tabela.')
      } else {
        setProducts((prev) => prev.map((p) => (p.id === editingId ? data[0] : p)))
        showToast('success', 'Produto atualizado!')
        cancelEdit()
      }
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select()

      if (error) {
        showToast('error', `Erro ao cadastrar: ${error.message}`)
      } else if (!data || data.length === 0) {
        showToast('error', 'Nada foi inserido. Verifique as policies (RLS) da tabela.')
      } else {
        setProducts((prev) => (prev.some((p) => p.id === data[0].id) ? prev : [...prev, data[0]]))
        showToast('success', 'Produto cadastrado!')
        setForm(EMPTY_FORM)
      }
    }

    setSaving(false)
  }

  // DELETE
  async function handleDelete(id) {
    setDeletingId(id)
    const { data, error } = await supabase.from('products').delete().eq('id', id).select()

    if (error) {
      showToast('error', `Erro ao excluir: ${error.message}`)
    } else if (!data || data.length === 0) {
      showToast('error', 'Nada foi excluído. Verifique as policies (RLS) da tabela.')
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id))
      if (editingId === id) cancelEdit()
      showToast('success', 'Produto excluído.')
    }

    setDeletingId(null)
    setConfirmId(null)
  }

  return (
    <main className="flex-grow pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-[1200px] mx-auto w-full">
      <header className="mb-10">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
          Gerenciar Cardápio
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Cadastre, edite e exclua produtos. As mudanças vão direto para o banco.
        </p>
      </header>

      {toast && (
        <div
          role="status"
          className={`fixed top-24 right-4 left-4 md:left-auto md:w-96 z-50 rounded-lg px-4 py-3 shadow-lg font-label-md text-label-md ${
            toast.type === 'success'
              ? 'bg-tertiary text-on-tertiary'
              : 'bg-error-container text-on-error-container'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-lg items-start">
        {/* Formulário (Create / Update) */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-low rounded-xl p-6 flex flex-col gap-4 lg:sticky lg:top-28"
        >
          <h2 className="font-headline-md text-headline-md text-primary">
            {editingId ? 'Editar produto' : 'Novo produto'}
          </h2>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md text-on-surface-variant">Nome</span>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Ex.: Cappuccino"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md text-on-surface-variant">Preço (R$)</span>
            <input
              className={inputCls}
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              placeholder="12,90"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md text-on-surface-variant">Descrição</span>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Conte o que tem no produto"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md text-on-surface-variant">URL da imagem</span>
            <input
              className={inputCls}
              type="url"
              value={form.image_url}
              onChange={(e) => setField('image_url', e.target.value)}
              placeholder="https://..."
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="font-label-md text-label-md text-on-surface-variant mb-1">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => {
                const on = form.tags.includes(t.value)
                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => toggleTag(t.value)}
                    aria-pressed={on}
                    className={`px-4 py-1.5 rounded-full border font-label-md text-label-md transition-colors ${
                      on
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-on-primary rounded-full px-6 py-3 font-label-md text-label-md disabled:opacity-60 hover:bg-primary-container transition-colors"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="border border-primary text-primary rounded-full px-6 py-3 font-label-md text-label-md hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista (Read / Delete) */}
        <section>
          <h2 className="font-headline-md text-headline-md text-primary mb-4">
            Produtos cadastrados {!loading && `(${products.length})`}
          </h2>

          {loading && (
            <div className="flex items-center gap-3 py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="font-body-md text-on-surface-variant">Carregando produtos...</p>
            </div>
          )}

          {!loading && loadError && (
            <p className="font-body-md text-error py-6">Não foi possível carregar: {loadError}</p>
          )}

          {!loading && !loadError && products.length === 0 && (
            <p className="font-body-md text-on-surface-variant py-6">
              Nenhum produto ainda. Cadastre o primeiro ao lado.
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {products.map((p) => (
              <li
                key={p.id}
                className={`bg-surface rounded-xl border p-3 flex gap-4 items-center ${
                  editingId === p.id ? 'border-primary' : 'border-surface-variant'
                }`}
              >
                <div className="w-20 h-20 rounded-lg bg-surface-container overflow-hidden shrink-0">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex justify-between gap-3">
                    <h3 className="font-headline-md text-primary text-lg leading-tight truncate">{p.name}</h3>
                    <span className="font-label-md text-label-md text-secondary font-bold whitespace-nowrap">
                      {fmt(p.price)}
                    </span>
                  </div>
                  <p className="font-body-md text-on-surface-variant text-sm line-clamp-1">{p.description}</p>
                  {(p.tags || []).length > 0 && (
                    <p className="font-label-sm text-label-sm text-outline mt-1">{p.tags.join(', ')}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {confirmId === p.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="bg-error text-on-error rounded-full px-4 py-2 font-label-md text-label-md disabled:opacity-60"
                      >
                        {deletingId === p.id ? 'Excluindo...' : 'Confirmar'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="border border-outline-variant text-on-surface-variant rounded-full px-4 py-2 font-label-md text-label-md"
                      >
                        Voltar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(p)}
                        className="border border-primary text-primary rounded-full px-4 py-2 font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmId(p.id)}
                        className="border border-error text-error rounded-full px-4 py-2 font-label-md text-label-md hover:bg-error hover:text-on-error transition-colors"
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
