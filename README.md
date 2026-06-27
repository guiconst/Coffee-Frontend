# ☕ Constantino Coffee – Front-end

Site estático do Constantino Coffee. HTML + Tailwind CSS + JavaScript vanilla, com deploy na **Vercel**.

---

## 📦 Estrutura

```
constantino-frontend/
├── index.html        ← Página inicial
├── cardapio.html     ← Cardápio com filtros
├── detalhes.html     ← Detalhe do produto
├── carrinho.html     ← Carrinho de compras
├── checkout.html     ← Finalizar pedido
├── login.html        ← Login / Cadastro
├── promocao.html     ← Promoções
├── sobre.html        ← Sobre a cafeteria
├── contato.html      ← Formulário de contato
├── main.js           ← Lógica do site (cart, favoritos, UI)
├── api.js            ← Cliente HTTP para a API back-end
└── vercel.json
```

---

## ⚙️ Configuração da API

Edite o arquivo `api.js` e ajuste a URL base:

```js
const API_BASE = window.CONSTANTINO_API_URL || 'https://SUA_API.vercel.app';
```

Ou adicione no `<head>` de cada HTML antes de carregar `api.js`:

```html
<script>
  window.CONSTANTINO_API_URL = 'https://constantino-coffee-api.vercel.app';
</script>
```

---

## 🚀 Deploy na Vercel

1. No [Vercel Dashboard](https://vercel.com): **Add New Project** → selecione `constantino-coffee-frontend`
2. Framework Preset: **Other** (site estático, sem build)
3. Clique em **Deploy**

Não há variáveis de ambiente necessárias – a URL da API fica em `api.js`.

---

## 🔗 Integração com a API

O arquivo `api.js` exporta os módulos:

```js
import { Auth, Products, Orders, Favorites, Contact } from './api.js';

// Exemplos:
const { products } = await Products.list({ category: 'cafes-especiais' });
await Auth.login('email@exemplo.com', 'senha123');
await Orders.createFromCart({ payment_method: 'pix', address_id: 'uuid...' });
```

O token de sessão é armazenado automaticamente em `localStorage` após login.
