# ☕ Constantino Coffee — React + Vite + Capacitor + Supabase

Migração do site estático (HTML/JS) para React + Vite, empacotado com Capacitor,
consumindo dados direto do Supabase via SDK (`@supabase/supabase-js`).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:5173 e o app já redireciona para `/cardapio`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com as chaves do seu projeto Supabase
(Project Settings → API → Project URL / anon public key):

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

O `.env.local` **nunca** deve ser commitado (já está no `.gitignore` por padrão do Vite: `*.local`).

## Estrutura relevante

```
src/
├── lib/supabaseClient.js   ← cria o cliente Supabase (usa as env vars acima)
├── pages/Cardapio.jsx      ← busca produtos com supabase.from('products').select('*')
├── components/Navbar.jsx
└── App.jsx                 ← rotas (react-router-dom)
```

## Build

```bash
npm run build     # gera dist/
npx cap sync      # sincroniza com o projeto Android do Capacitor
```
