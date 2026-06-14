import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, Minus, Trash2 } from 'lucide-react';

const CartDrawer = ({ onOpenCheckout }) => {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart
  } = useApp();

  if (!cartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('drawer-backdrop')) {
      setCartOpen(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={handleBackdropClick}>
      <div className="drawer-content">
        <div className="drawer-header flex-between">
          <h2>Shopping Bag</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {cart.length > 0 && (
              <button
                style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500, transition: 'var(--transition-fast)' }}
                onClick={clearCart}
                onMouseOver={e => e.target.style.color = 'var(--error)'}
                onMouseOut={e => e.target.style.color = 'var(--text-light)'}
              >
                Clear All
              </button>
            )}
            <button className="nav-btn" onClick={() => setCartOpen(false)} aria-label="Close Shopping Bag">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>Your shopping bag is empty.</p>
              <button
                className="form-submit-btn"
                style={{ marginTop: '1.5rem', width: 'auto', padding: '0.75rem 1.5rem' }}
                onClick={() => setCartOpen(false)}
              >
                Start Browsing
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.product}>
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.name}</h4>
                  <p className="cart-item-price">₹{item.price}</p>
                  
                  <div className="flex-between">
                    <div className="quantity-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateCartQuantity(item.product, item.quantity - 1)}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateCartQuantity(item.product, item.quantity + 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.product)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="cart-total-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Shipping and taxes calculated at checkout.
            </p>
            <button
              className="checkout-btn"
              onClick={() => {
                setCartOpen(false);
                onOpenCheckout();
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
