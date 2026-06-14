import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, Minus } from 'lucide-react';

const ProductDetailModal = ({ product, onClose }) => {
  const { addToCart, updateCartQuantity, cart } = useApp();

  if (!product) return null;

  const cartItem = cart.find((item) => item.product === product._id);
  const inCart = !!cartItem;
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target.classList.contains('modal-backdrop') && onClose()}>
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <button className="close-modal-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="detail-grid">
          <div>
            <img src={product.images[0]} alt={product.name} className="detail-img" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <span className="detail-category">{product.category}</span>
            <h2 className="detail-title">{product.name}</h2>
            <div className="detail-price">₹{product.price}</div>
            
            <p className="detail-desc">{product.description}</p>
            
            {product.features && product.features.length > 0 && (
              <>
                <h4 className="detail-specs-title">Details & Specifications</h4>
                <ul className="detail-specs-list">
                  {product.features.map((spec, i) => (
                    <li key={i}>{spec}</li>
                  ))}
                </ul>
              </>
            )}

            {inCart ? (
              <div className="card-stepper" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '48px' }}>
                <button
                  className="stepper-btn"
                  style={{ width: '48px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => updateCartQuantity(product._id, quantity - 1)}
                >
                  <Minus size={18} />
                </button>
                <span className="stepper-val" style={{ fontSize: '1rem', fontWeight: 600 }}>{quantity} in Bag</span>
                <button
                  className="stepper-btn"
                  style={{ width: '48px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => updateCartQuantity(product._id, quantity + 1)}
                >
                  <Plus size={18} />
                </button>
              </div>
            ) : (
              <button
                className="form-submit-btn"
                style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={() => {
                  addToCart(product);
                }}
              >
                <Plus size={18} /> Add to Bag
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
