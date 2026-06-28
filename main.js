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
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }
    
    localStorage.setItem('coffee_cart', JSON.stringify(cart));
    updateCartBadges();
    showToast(`Adicionado: ${name}`);
};

window.removeFromCart = function(id) {
    let cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('coffee_cart', JSON.stringify(cart));
    updateCartBadges();
    renderCartPage();
};

window.updateQuantity = function(id, delta) {
    let cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
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
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
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
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 bg-surface-container rounded-xl">
                <span class="material-symbols-outlined text-6xl text-outline mb-4">remove_shopping_cart</span>
                <h2 class="text-xl text-primary font-headline-md mb-2">Seu carrinho está vazio</h2>
                <p class="text-on-surface-variant mb-6">Que tal adicionar um delicioso café?</p>
                <a href="cardapio.html" class="inline-block bg-primary text-on-primary px-6 py-3 rounded-full hover:opacity-90 transition-opacity">Ver Cardápio</a>
            </div>`;
        subtotalEl.textContent = "R$ 0,00";
        totalEl.textContent = "R$ 0,00";
        return;
    }

    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const imgUrl = item.image || "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=200&h=200";
        
        return `
            <div class="flex items-center gap-4 bg-surface-container rounded-xl p-4 shadow-sm relative">
                <img src="${imgUrl}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">
                <div class="flex-grow">
                    <h3 class="font-headline-md text-primary text-lg">${item.name}</h3>
                    <p class="text-on-surface-variant font-label-md">${formatPrice(item.price)}</p>
                    
                    <div class="flex items-center gap-3 mt-2">
                        <button onclick="updateQuantity('${item.id}', -1)" class="w-8 h-8 rounded-full bg-surface border border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-colors">
                            <span class="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span class="font-bold w-4 text-center">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)" class="w-8 h-8 rounded-full bg-surface border border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-colors">
                            <span class="material-symbols-outlined text-sm">add</span>
                        </button>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end justify-between h-24">
                    <button onclick="removeFromCart('${item.id}')" class="text-error hover:opacity-70 p-1" aria-label="Remover">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                    <span class="font-bold text-primary">${formatPrice(itemTotal)}</span>
                </div>
            </div>
        `;
    }).join('');

    subtotalEl.textContent = formatPrice(total);
    totalEl.textContent = formatPrice(total);
}

function renderCheckoutPage() {
    const container = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    if (!container) return;

    const cart = JSON.parse(localStorage.getItem('coffee_cart') || '[]');
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p class="text-error font-bold">Carrinho vazio.</p>`;
        totalEl.textContent = "R$ 0,00";
        return;
    }

    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="flex justify-between items-center py-2 border-b border-surface-variant last:border-0">
                <div class="flex gap-2 items-center">
                    <span class="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-xs font-bold">${item.quantity}x</span>
                    <span class="font-medium">${item.name}</span>
                </div>
                <span>${formatPrice(itemTotal)}</span>
            </div>
        `;
    }).join('');

    totalEl.textContent = formatPrice(total);
}

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
