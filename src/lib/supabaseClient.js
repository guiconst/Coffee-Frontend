import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  // Ajuda a diagnosticar rápido se o .env.local não foi carregado
  console.error(
    '[supabaseClient] Faltam variáveis de ambiente. Confira se o arquivo ' +
    '.env.local existe na raiz do projeto e se as chaves começam com VITE_.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
