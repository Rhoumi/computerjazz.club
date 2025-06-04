// Shopping Cart Functionality
class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.init();
    }

    init() {
        this.bindEvents();
        this.createCartWidget();
        this.updateCartDisplay();
    }

    bindEvents() {
        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                e.preventDefault();
                this.addToCart(e.target);
            }

            if (e.target.classList.contains('cart-toggle')) {
                e.preventDefault();
                this.toggleCart();
            }

            if (e.target.classList.contains('remove-item')) {
                e.preventDefault();
                this.removeItem(e.target.dataset.itemId);
            }

            if (e.target.classList.contains('clear-cart')) {
                e.preventDefault();
                this.clearCart();
            }
        });

        // Size and variant selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('size-option') || e.target.classList.contains('variant-option')) {
                e.preventDefault();
                this.selectOption(e.target);
            }
        });
    }

    selectOption(element) {
        const parent = element.parentElement;
        parent.querySelectorAll('.size-option, .variant-option').forEach(option => {
            option.classList.remove('selected');
        });
        element.classList.add('selected');
    }

    addToCart(button) {
        // Find the container - could be .merch-item (shop pages) or .merch-info (individual merch pages)
        const merchContainer = button.closest('.merch-item') || button.closest('.merch-info');
        if (!merchContainer) {
            console.error('Could not find merchandise container');
            return;
        }
        
        const itemName = button.dataset.item;
        const itemPrice = parseFloat(button.dataset.price);
        
        // Get selected options
        const selectedSize = merchContainer.querySelector('.size-option.selected')?.textContent;
        const selectedVariant = merchContainer.querySelector('.variant-option.selected')?.textContent;
        
        // Find the image - different locations in different layouts
        let imageElement = merchContainer.querySelector('.merch-image img');
        if (!imageElement) {
            // Try alternative locations for image
            imageElement = document.querySelector('.merch-image-large') || 
                          document.querySelector('.album-cover') ||
                          merchContainer.querySelector('img');
        }
        
        // Create item object
        const item = {
            id: this.generateItemId(itemName, selectedSize, selectedVariant),
            name: itemName,
            price: itemPrice,
            size: selectedSize,
            variant: selectedVariant,
            image: imageElement ? imageElement.src : '/assets/images/default-merch.jpg',
            quantity: 1
        };

        // Check if item already exists
        const existingItem = this.items.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push(item);
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showAddedNotification(item);
    }

    generateItemId(name, size, variant) {
        return `${name.replace(/\s+/g, '-').toLowerCase()}-${size || 'default'}-${variant || 'default'}`;
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartDisplay();
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
    }

    updateCartDisplay() {
        this.updateCartCount();
        this.updateCartContents();
    }

    updateCartCount() {
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }

    updateCartContents() {
        const cartItems = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total');
        
        if (!cartItems) return;

        if (this.items.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            if (cartTotal) cartTotal.textContent = '$0.00';
            return;
        }

        const itemsHTML = this.items.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    ${item.size ? `<p>Size: ${item.size}</p>` : ''}
                    ${item.variant ? `<p>Variant: ${item.variant}</p>` : ''}
                    <p>Quantity: ${item.quantity}</p>
                    <p class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button class="remove-item" data-item-id="${item.id}">×</button>
            </div>
        `).join('');

        cartItems.innerHTML = itemsHTML;

        if (cartTotal) {
            const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `$${total.toFixed(2)}`;
        }
    }

    createCartWidget() {
        // Check if cart widget already exists
        if (document.querySelector('.cart-widget')) return;

        // Find the nav cart container
        const navCart = document.querySelector('.nav-cart');
        if (!navCart) {
            console.warn('Navigation cart container not found, falling back to body');
            // Fallback for pages that don't have the updated nav structure
            const cartHTML = `
                <div class="cart-widget cart-widget-fallback">
                    <button class="cart-toggle">
                        🛒 Cart <span class="cart-count">0</span>
                    </button>
                    <div class="cart-dropdown">
                        <div class="cart-header">
                            <h3>Shopping Cart</h3>
                        </div>
                        <div class="cart-items"></div>
                        <div class="cart-footer">
                            <div class="cart-total-row">
                                <strong>Total: <span class="cart-total">$0.00</span></strong>
                            </div>
                            <div class="cart-actions">
                                <button class="btn btn-secondary clear-cart">Clear Cart</button>
                                <button class="btn btn-primary checkout-btn">Checkout</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', cartHTML);
            return;
        }

        const cartHTML = `
            <div class="cart-widget">
                <button class="cart-toggle">
                    🛒 <span class="cart-text">Cart</span> <span class="cart-count">0</span>
                </button>
                <div class="cart-dropdown">
                    <div class="cart-header">
                        <h3>Shopping Cart</h3>
                    </div>
                    <div class="cart-items"></div>
                    <div class="cart-footer">
                        <div class="cart-total-row">
                            <strong>Total: <span class="cart-total">$0.00</span></strong>
                        </div>
                        <div class="cart-actions">
                            <button class="btn btn-secondary clear-cart">Clear Cart</button>
                            <button class="btn btn-primary checkout-btn">Checkout</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        navCart.innerHTML = cartHTML;
    }

    toggleCart() {
        const dropdown = document.querySelector('.cart-dropdown');
        dropdown.classList.toggle('show');
    }

    showAddedNotification(item) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <div class="notification-content">
                ✓ Added ${item.name} to cart
                ${item.size ? `<br>Size: ${item.size}` : ''}
                ${item.variant ? `<br>Variant: ${item.variant}` : ''}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    saveCart() {
        localStorage.setItem('computerJazzCart', JSON.stringify(this.items));
    }

    loadCart() {
        const saved = localStorage.getItem('computerJazzCart');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize cart on shop-related pages
    const isShopPage = window.location.pathname.includes('/shop/') || 
                      document.querySelector('.merch-item, .merch-info');
    
    if (isShopPage) {
        new ShoppingCart();
    }
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
}
