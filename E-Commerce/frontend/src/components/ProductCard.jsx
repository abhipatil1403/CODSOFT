import React from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Minus } from 'lucide-react';

const ProductCard = ({ product, onSelectProduct }) => {
  const { addToCart, updateCartQuantity, cart } = useApp();

  const cartItem = cart.find((item) => item.product === product._id);
  const inCart = !!cartItem;
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="product-card">
      <div className="card-img-wrapper" onClick={() => onSelectProduct(product)}>
        <span className="card-category">{product.category}</span>
        <img
          src={product.images[0]}
          alt={product.name}
          className="card-img"
          loading="lazy"
        />
      </div>

      <div className="card-details">
        <h3 className="card-title" onClick={() => onSelectProduct(product)}>
          {product.name}
        </h3>
        <p className="card-price">₹{product.price}</p>
        
        {inCart ? (
          <div className="card-stepper" onClick={(e) => e.stopPropagation()}>
            <button
              className="stepper-btn"
              onClick={() => updateCartQuantity(product._id, quantity - 1)}
            >
              <Minus size={14} />
            </button>
            <span className="stepper-val">{quantity} in Bag</span>
            <button
              className="stepper-btn"
              onClick={() => updateCartQuantity(product._id, quantity + 1)}
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <button
            className="card-btn"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
          >
            <Plus size={16} /> Add to Bag
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
