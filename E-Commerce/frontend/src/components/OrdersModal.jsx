import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar, DollarSign, Package } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OrdersModal = ({ isOpen, onClose }) => {
  const { token } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetchOrders();
    }
  }, [isOpen, token]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/myorders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Sort newest first
        setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target.classList.contains('modal-backdrop') && onClose()}>
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <button className="close-modal-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <h2 className="form-title">Your Orders</h2>
        <p className="form-subtitle">History of your artisan acquisitions.</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Retrieving order details...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Package size={32} style={{ marginBottom: '1rem', color: 'var(--accent-gold)' }} />
            <p>You have not placed any orders yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {orders.map((order) => (
              <div key={order._id} style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-cream)'
              }}>
                <div className="flex-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Calendar size={14} />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                    ID: #{order._id.substring(0, 8)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex-between" style={{ fontSize: '0.9rem' }}>
                      <span>
                        {item.name} <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>x{item.quantity}</span>
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-between" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontWeight: 600 }}>
                  <span>Total Paid</span>
                  <span>₹{order.totalPrice}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersModal;
