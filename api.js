/**
 * api.js – Cliente HTTP para a API Constantino Coffee
 * Substitui as chamadas localStorage por chamadas reais à API.
 *
 * Configure a URL base abaixo apontando para seu deploy na Vercel.
 */

const API_BASE = window.CONSTANTINO_API_URL || 'https://coffee-backend-eight.vercel.app';

// ── Helpers ───────────────────────────────────────────────

function getToken() {
  const session = JSON.parse(localStorage.getItem('coffee_session') || 'null');
  return session?.access_token || null;
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
  return json;
}

// ── Auth ──────────────────────────────────────────────────

export const Auth = {
  async register(email, password, fullName) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    if (data.session) localStorage.setItem('coffee_session', JSON.stringify(data.session));
    return data;
  },

  async login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.session) localStorage.setItem('coffee_session', JSON.stringify(data.session));
    return data;
  },

  logout() {
    localStorage.removeItem('coffee_session');
    window.location.href = 'index.html';
  },

  async getProfile() {
    return apiFetch('/api/auth/me');
  },

  async updateProfile(full_name, phone) {
    return apiFetch('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ full_name, phone }),
    });
  },

  isLoggedIn() {
    return !!getToken();
  },
};

// ── Products ──────────────────────────────────────────────

export const Products = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/products${qs ? '?' + qs : ''}`);
  },

  async getBySlug(slug) {
    return apiFetch(`/api/products/${slug}`);
  },

  async getCategories() {
    return apiFetch('/api/products/categories');
  },

  async getPromotions() {
    return apiFetch('/api/products?promotion=true');
  },

  async getFeatured() {
    return apiFetch('/api/products?tag=destaque');
  },
};

// ── Orders ────────────────────────────────────────────────

export const Orders = {
  async list() {
    return apiFetch('/api/orders');
  },

  async get(id) {
    return apiFetch(`/api/orders/${id}`);
  },

  /**
   * Cria pedido a partir do carrinho atual (localStorage)
   * @param {object} opts – { address_id, payment_method, notes }
   */
  async createFromCart(opts = {}) {
    const cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    if (cart.length === 0) throw new Error('Carrinho vazio.');

    const items = cart.map(i => ({
      product_id: i.id,   // o id armazenado no carrinho é o UUID do produto
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    const data = await apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ ...opts, items }),
    });

    // Limpa carrinho após pedido criado
    localStorage.removeItem('coffee_cart');
    return data;
  },

  async cancel(id) {
    return apiFetch(`/api/orders/${id}/cancel`, { method: 'PATCH' });
  },
};

// ── Favorites ─────────────────────────────────────────────

export const Favorites = {
  async list() {
    return apiFetch('/api/favorites');
  },

  async add(productId) {
    return apiFetch(`/api/favorites/${productId}`, { method: 'POST' });
  },

  async remove(productId) {
    return apiFetch(`/api/favorites/${productId}`, { method: 'DELETE' });
  },
};

// ── Contact ───────────────────────────────────────────────

export const Contact = {
  async send(name, email, subject, message) {
    return apiFetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, subject, message }),
    });
  },
};
