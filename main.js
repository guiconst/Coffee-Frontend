const COFFEE_API = 'https://coffee-backend-eight.vercel.app';

/**
 * Retorna uma sessão válida, fazendo refresh automático se o token estiver perto de expirar.
 * Retorna null se o usuário não estiver logado ou a sessão não puder ser renovada.
 */
async function getValidSession() {
    let session = JSON.parse(localStorage.getItem('coffee_session') || 'null');
    if (!session) return null;

    const expiresAt = session.expires_at; // unix timestamp em segundos
    const nowSec = Math.floor(Date.now() / 1000);
    const isExpired = expiresAt && (expiresAt - nowSec) < 60;

    if (isExpired && session.refresh_token) {
        try {
            const res = await fetch(`${COFFEE_API}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: session.refresh_token })
            });
            if (res.ok) {
                const data = await res.json();
                session = data.session;
                localStorage.setItem('coffee_session', JSON.stringify(session));
                if (data.user) localStorage.setItem('coffee_user', JSON.stringify(data.user));
            } else {
                localStorage.removeItem('coffee_session');
                localStorage.removeItem('coffee_user');
                return null;
            }
        } catch (_) {
            return null;
        }
    }

    return session;
}
window.getValidSession = getValidSession;

document.addEventListener('DOMContentLoaded', () => {
    // 0. Ícone de perfil: redireciona para perfil.html se logado, login.html se não
    const _session = JSON.parse(localStorage.getItem('coffee_session') || 'null');
    const _isLoggedIn = !!(_session && _session.access_token);
    const _profileHref = _isLoggedIn ? 'perfil.html' : 'login.html';
    const _profileLabel = _isLoggedIn ? 'Perfil' : 'Login';

    // Desktop + mobile header icons
    document.querySelectorAll('a[aria-label="Login"], a[aria-label="Perfil"]').forEach(link => {
        link.setAttribute('href', _profileHref);
        link.setAttribute('aria-label', _profileLabel);
    });

    // Link do menu hamburguer
    const _mobileProfileLink = document.getElementById('mobile-profile-link');
    if (_mobileProfileLink) {
        _mobileProfileLink.setAttribute('href', _profileHref);
        const _span = _mobileProfileLink.querySelector('span.material-symbols-outlined');
        _mobileProfileLink.innerHTML = `<span class="material-symbols-outlined text-xl">${_isLoggedIn ? 'account_circle' : 'person'}</span> ${_isLoggedIn ? 'Meu Perfil' : 'Entrar / Cadastrar'}`;
    }

    // 1. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            const icon = mobileMenuBtn.querySelector('span');
            if (mobileMenu.classList.contains('hidden')) {
                icon.textContent = 'menu';
            } else {
                icon.textContent = 'close';
            }
        });
    }

    // 2. Active Link Highlight
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('header nav a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.remove('text-on-surface-variant', 'hover:text-primary');
            link.classList.add('text-primary', 'font-bold', 'border-b-2', 'border-primary', 'pb-1');
        }
    });

    // --- AUTO-WIRE UI ELEMENTS (Cart & Favorites) ---
    autoWireCartButtons();
    autoInjectFavoriteButtons();

    // 3. Cart & Favorites Initialization
    updateCartBadges();
    updateFavoriteButtons();
    setupFavoriteButtons();

    // 5. Category Filtering
    setupCategoryFilters();

    // 6. Render Cart if on Cart Page
    if (document.getElementById('cart-items-container')) {
        renderCartPage();
    }

    // 7. Render Checkout if on Checkout Page
    if (document.getElementById('checkout-items')) {
        renderCheckoutPage();
    }
});

// --- Auto-Wire Functions ---

function autoWireCartButtons() {
    const buttons = document.querySelectorAll('button, a');
    buttons.forEach(btn => {
        // Look for buttons that say "Adicionar" or similar, inside a product card
        if (btn.textContent.toLowerCase().includes('adicionar') && btn.closest('.bg-surface')) {
            // Remove href if it's a link to prevent navigation
            if (btn.tagName === 'A') {
                btn.removeAttribute('href');
                btn.style.cursor = 'pointer';
            }
            
            // Replace click listener
            const clone = btn.cloneNode(true);
            btn.parentNode.replaceChild(clone, btn);
            
            clone.addEventListener('click', (e) => {
                e.preventDefault();
                const card = clone.closest('.bg-surface');
                const nameEl = card.querySelector('h3');
                if (!nameEl) return;
                
                const name = nameEl.textContent.trim();
                const priceMatch = card.textContent.match(/R\$\s*(\d+[,.]\d+)/);
                let price = 15.00; // Default fallback
                if (priceMatch) {
                    price = parseFloat(priceMatch[1].replace(',', '.'));
                }
                
                const imgEl = card.querySelector('img');
                const image = imgEl ? imgEl.src : '';
                const id = name.toLowerCase().replace(/\s+/g, '-');
                
                window.addToCart(id, name, price, image);
            });
        }
    });
}

function autoInjectFavoriteButtons() {
    const itemCards = document.querySelectorAll('.bg-surface');
    itemCards.forEach(card => {
        const imgContainer = card.querySelector('.h-64, .h-48');
        const nameEl = card.querySelector('h3');
        
        // Only inject if it looks like a product card and doesn't already have a favorite button
        if (imgContainer && nameEl && !card.querySelector('.favorite-btn')) {
            const id = nameEl.textContent.trim().toLowerCase().replace(/\s+/g, '-');
            const favBtn = document.createElement('button');
            favBtn.className = 'favorite-btn absolute top-3 right-3 w-10 h-10 bg-surface/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10';
            favBtn.setAttribute('data-id', id);
            favBtn.setAttribute('aria-label', 'Favoritar');
            favBtn.innerHTML = `<span class="material-symbols-outlined text-outline" style="font-variation-settings: 'FILL' 0;">favorite</span>`;
            
            imgContainer.style.position = 'relative'; // Ensure positioning works
            imgContainer.appendChild(favBtn);
        }
    });
}

// --- Global Functions ---

window.addToCart = function(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    const existing = cart.find(item => item.id === id && !item.size && (!item.extras || item.extras.length === 0));

    if (existing) {
        existing.qty = (existing.qty || 0) + 1;
        existing.total = existing.price * existing.qty;
    } else {
        cart.push({ id, name, price, image_url: image, qty: 1, size: null, extras: [], total: price });
    }

    localStorage.setItem('coffee_cart', JSON.stringify(cart));
    updateCartBadges();
    showToast(`Adicionado: ${name}`);
};

window.removeFromCart = function(index) {
    let cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    cart.splice(index, 1);
    localStorage.setItem('coffee_cart', JSON.stringify(cart));
    updateCartBadges();
    renderCartPage();
};

window.updateQuantity = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    const item = cart[index];
    if (item) {
        const qty = (item.qty || 1) + delta;
        if (qty <= 0) {
            cart.splice(index, 1);
        } else {
            item.qty = qty;
            const unitPrice = parseFloat(item.price || 0)
                + (item.size?.price || 0)
                + (item.extras || []).reduce((s, e) => s + (e.price || 0), 0);
            item.total = unitPrice * qty;
        }
        localStorage.setItem('coffee_cart', JSON.stringify(cart));
        updateCartBadges();
        renderCartPage();
    }
};

window.finishCheckout = function() {
    showToast("Pedido confirmado com sucesso! Redirecionando...");
    localStorage.removeItem('coffee_cart');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
};

// --- Helper Functions ---

function updateCartBadges() {
    const cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 0), 0);
    const badges = [document.getElementById('cart-badge'), document.getElementById('mobile-cart-badge')];

    badges.forEach(badge => {
        if (badge) {
            if (totalItems > 0) {
                badge.textContent = totalItems;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    });
}

function setupFavoriteButtons() {
    const favButtons = document.querySelectorAll('.favorite-btn');
    favButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent triggering other clicks
            const itemId = btn.getAttribute('data-id');
            if (!itemId) return;

            let favorites = JSON.parse(localStorage.getItem('coffee_favorites') || '[]');
            if (favorites.includes(itemId)) {
                favorites = favorites.filter(id => id !== itemId);
            } else {
                favorites.push(itemId);
                showToast("Adicionado aos favoritos");
            }
            
            localStorage.setItem('coffee_favorites', JSON.stringify(favorites));
            updateFavoriteButtons();
        });
    });
}

function updateFavoriteButtons() {
    const favorites = JSON.parse(localStorage.getItem('coffee_favorites') || '[]');
    const favButtons = document.querySelectorAll('.favorite-btn');
    
    favButtons.forEach(btn => {
        const itemId = btn.getAttribute('data-id');
        const icon = btn.querySelector('span');
        
        if (favorites.includes(itemId)) {
            icon.setAttribute('style', "font-variation-settings: 'FILL' 1;");
            icon.classList.add('text-error');
            icon.classList.remove('text-outline');
        } else {
            icon.setAttribute('style', "font-variation-settings: 'FILL' 0;");
            icon.classList.remove('text-error');
            icon.classList.add('text-outline');
        }
    });
}

function setupCategoryFilters() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    const menuItems = document.querySelectorAll('.menu-item');
    
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.forEach(t => {
                    t.classList.remove('bg-primary', 'text-on-primary');
                    t.classList.add('bg-surface-container-high', 'text-on-surface-variant');
                });
                tab.classList.remove('bg-surface-container-high', 'text-on-surface-variant');
                tab.classList.add('bg-primary', 'text-on-primary');
                
                const filter = tab.getAttribute('data-filter');
                menuItems.forEach(item => {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });
    }
}

function formatPrice(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;

    const cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    let subtotal = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 bg-surface-container rounded-xl">
                <span class="material-symbols-outlined text-6xl text-outline mb-4">remove_shopping_cart</span>
                <h2 class="text-xl text-primary font-headline-md mb-2">Seu carrinho está vazio</h2>
                <p class="text-on-surface-variant mb-6">Que tal adicionar um delicioso café?</p>
                <a href="cardapio.html" class="inline-block bg-primary text-on-primary px-6 py-3 rounded-full hover:opacity-90 transition-opacity">Ver Cardápio</a>
            </div>`;
        if (subtotalEl) subtotalEl.textContent = "R$ 0,00";
        if (totalEl) totalEl.textContent = "R$ 0,00";
        return;
    }

    container.innerHTML = cart.map((item, index) => {
        const qty = parseInt(item.qty, 10) || 1;
        const basePrice = parseFloat(item.price) || 0;
        const sizePrice = item.size?.price || 0;
        const extrasPrice = (item.extras || []).reduce((s, e) => s + (parseFloat(e.price) || 0), 0);
        const unitPrice = basePrice + sizePrice + extrasPrice;
        const itemTotal = unitPrice * qty;
        subtotal += itemTotal;

        const imgUrl = item.image_url || item.image || "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=200&h=200";

        const detailsParts = [];
        if (item.size?.label) detailsParts.push(item.size.label);
        if (item.extras && item.extras.length) detailsParts.push(item.extras.map(e => e.label).join(', '));
        const detailsLine = detailsParts.length
            ? `<p class="text-on-surface-variant font-label-sm mt-0.5">${detailsParts.join(' • ')}</p>`
            : '';

        return `
            <div class="flex items-center gap-4 bg-surface-container rounded-xl p-4 shadow-sm relative">
                <div class="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-container-high">
                    <img src="${imgUrl}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=200&h=200';">
                </div>
                <div class="flex-grow min-w-0">
                    <h3 class="font-headline-md text-primary text-lg truncate">${item.name}</h3>
                    <p class="text-on-surface-variant font-label-md">${formatPrice(unitPrice)} / un</p>
                    ${detailsLine}

                    <div class="flex items-center gap-3 mt-2">
                        <button onclick="updateQuantity(${index}, -1)" class="w-8 h-8 rounded-full bg-surface border border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-colors" aria-label="Diminuir quantidade">
                            <span class="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span class="font-bold w-4 text-center">${qty}</span>
                        <button onclick="updateQuantity(${index}, 1)" class="w-8 h-8 rounded-full bg-surface border border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-colors" aria-label="Aumentar quantidade">
                            <span class="material-symbols-outlined text-sm">add</span>
                        </button>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end justify-between h-24 shrink-0">
                    <button onclick="removeFromCart(${index})" class="text-error hover:opacity-70 p-1" aria-label="Remover">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                    <span class="font-bold text-primary">${formatPrice(itemTotal)}</span>
                </div>
            </div>
        `;
    }).join('');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

function getCartSubtotal() {
    const cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    return cart.reduce((sum, item) => {
        const qty = parseInt(item.qty, 10) || 1;
        const basePrice = parseFloat(item.price) || 0;
        const sizePrice = item.size?.price || 0;
        const extrasPrice = (item.extras || []).reduce((s, e) => s + (parseFloat(e.price) || 0), 0);
        return sum + (basePrice + sizePrice + extrasPrice) * qty;
    }, 0);
}
window.getCartSubtotal = getCartSubtotal;

function renderCheckoutPage() {
    const container = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    const discountRow = document.getElementById('checkout-discount-row');
    const discountEl = document.getElementById('checkout-discount');
    if (!container) return;

    const cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');

    if (cart.length === 0) {
        container.innerHTML = `<p class="text-error font-bold">Carrinho vazio.</p>`;
        if (subtotalEl) subtotalEl.textContent = "R$ 0,00";
        if (totalEl) totalEl.textContent = "R$ 0,00";
        if (discountRow) discountRow.classList.add('hidden');
        return;
    }

    let subtotal = 0;
    container.innerHTML = cart.map(item => {
        const qty = parseInt(item.qty, 10) || 1;
        const basePrice = parseFloat(item.price) || 0;
        const sizePrice = item.size?.price || 0;
        const extrasPrice = (item.extras || []).reduce((s, e) => s + (parseFloat(e.price) || 0), 0);
        const itemTotal = (basePrice + sizePrice + extrasPrice) * qty;
        subtotal += itemTotal;
        const detailsParts = [];
        if (item.size?.label) detailsParts.push(item.size.label);
        if (item.extras && item.extras.length) detailsParts.push(item.extras.map(e => e.label).join(', '));
        const detailsLine = detailsParts.length
            ? `<div class="text-xs text-on-surface-variant/80 pl-7">${detailsParts.join(' • ')}</div>`
            : '';
        return `
            <div class="py-2 border-b border-surface-variant last:border-0">
                <div class="flex justify-between items-center">
                    <div class="flex gap-2 items-center">
                        <span class="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-xs font-bold">${qty}x</span>
                        <span class="font-medium">${item.name}</span>
                    </div>
                    <span>${formatPrice(itemTotal)}</span>
                </div>
                ${detailsLine}
            </div>
        `;
    }).join('');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    updateCheckoutTotalDisplay(subtotal);
}

function updateCheckoutTotalDisplay(subtotal) {
    const totalEl = document.getElementById('checkout-total');
    const discountRow = document.getElementById('checkout-discount-row');
    const discountEl = document.getElementById('checkout-discount');
    if (!totalEl) return;

    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    const isPix = paymentRadio && paymentRadio.value === 'pix';

    if (isPix) {
        const discount = subtotal * 0.05;
        const total = subtotal - discount;
        if (discountRow) discountRow.classList.remove('hidden');
        if (discountEl) discountEl.textContent = `- ${formatPrice(discount)}`;
        totalEl.textContent = formatPrice(total);
    } else {
        if (discountRow) discountRow.classList.add('hidden');
        totalEl.textContent = formatPrice(subtotal);
    }
}
window.updateCheckoutTotalDisplay = updateCheckoutTotalDisplay;

function showToast(message) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-xl shadow-lg z-[100] transition-opacity duration-300 opacity-0';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.remove('opacity-0');
    
    setTimeout(() => {
        toast.classList.add('opacity-0');
    }, 3000);
}
