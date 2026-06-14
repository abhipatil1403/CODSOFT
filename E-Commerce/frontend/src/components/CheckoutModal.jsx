import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, CreditCard, Loader2, QrCode, Smartphone, Lock } from 'lucide-react';

const CheckoutModal = ({ isOpen, onClose, onOpenAuth, onOpenOrders }) => {
  const { cart, user, placeOrder, setWasCheckoutTriggered } = useApp();
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' or 'Card'
  const [isProcessing, setIsProcessing] = useState(false);

  // Form States
  const [shipping, setShipping] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: 'India'
  });

  const [payment, setPayment] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });

  const [upiId, setUpiId] = useState('');

  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleShippingChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e) => {
    let { name, value } = e.target;
    if (name === 'number') {
      value = value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19);
    }
    if (name === 'expiry') {
      value = value.replace(/\//g, '').replace(/(\d{2})/g, '$1/').trim().substring(0, 5);
      if (value.endsWith('/')) value = value.slice(0, -1);
    }
    if (name === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 4);
    }
    setPayment({ ...payment, [name]: value });
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      setWasCheckoutTriggered(true);
      onOpenAuth();
      return;
    }
    setStep(2);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(async () => {
      const selectedMethodText = paymentMethod === 'UPI' ? `UPI (${upiId})` : 'Credit Card';
      const result = await placeOrder(shipping, selectedMethodText);
      setIsProcessing(false);
      if (result.success) {
        setStep(3);
      }
    }, 2000);
  };

  const resetForm = () => {
    setStep(1);
    setPaymentMethod('UPI');
    setShipping({ address: '', city: '', postalCode: '', country: 'India' });
    setPayment({ name: '', number: '', expiry: '', cvv: '' });
    setUpiId('');
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (isProcessing) return; // Block closing during transaction
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" style={{ maxWidth: step === 3 ? '450px' : '550px' }}>
        {step !== 3 && !isProcessing && (
          <button className="close-modal-btn" onClick={onClose} aria-label="Close Checkout">
            <X size={18} />
          </button>
        )}

        {/* Step 1: Shipping */}
        {step === 1 && (
          <div>
            <h2 className="form-title">Delivery Details</h2>
            <p className="form-subtitle">Enter your Indian delivery address destination.</p>
            
            {!user && (
              <div style={{
                backgroundColor: 'var(--accent-gold-light)',
                border: '1px solid var(--accent-gold)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Lock size={16} style={{ color: 'var(--accent-gold)' }} />
                <span>
                  You must be logged in to complete your checkout.{' '}
                  <span className="form-toggle-link" onClick={() => {
                    setWasCheckoutTriggered(true);
                    onOpenAuth();
                  }}>
                    Log In or Register here
                  </span>.
                </span>
              </div>
            )}

            <form onSubmit={handleShippingSubmit}>
              <div className="form-group">
                <label className="form-label">Street Address / Block / Locality</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  required
                  value={shipping.address}
                  onChange={handleShippingChange}
                  placeholder="Apartment 4B, Shanti Kunj, Sector 56"
                />
              </div>

              <div className="form-group">
                <label className="form-label">City / Town</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  required
                  value={shipping.city}
                  onChange={handleShippingChange}
                  placeholder="Gurgaon"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pincode (6-digit)</label>
                  <input
                    type="text"
                    name="postalCode"
                    className="form-input"
                    required
                    pattern="[0-9]{6}"
                    value={shipping.postalCode}
                    onChange={handleShippingChange}
                    placeholder="122002"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    name="country"
                    className="form-input"
                    required
                    value={shipping.country}
                    onChange={handleShippingChange}
                    placeholder="India"
                  />
                </div>
              </div>

              <div className="cart-total-row" style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Total Amount</span>
                <span>₹{total}</span>
              </div>

              <button type="submit" className="form-submit-btn">
                Continue to Payment
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div>
            <h2 className="form-title">Secure Payment</h2>
            <p className="form-subtitle">Choose your preferred Indian payment method.</p>

            {isProcessing && (
              <div style={{
                color: 'var(--accent-gold)',
                backgroundColor: 'var(--accent-gold-light)',
                border: '1px solid var(--accent-gold)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <Lock size={16} />
                <span>Transaction in progress. Please do not close this window or refresh the page.</span>
              </div>
            )}

            {/* Payment Mode Selector Tabs */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem'
            }}>
              <button
                type="button"
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: paymentMethod === 'UPI' ? 'var(--text-ink)' : 'var(--bg-cream)',
                  color: paymentMethod === 'UPI' ? 'var(--bg-cream)' : 'var(--text-ink)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'var(--transition-fast)',
                  opacity: isProcessing ? 0.6 : 1
                }}
                onClick={() => setPaymentMethod('UPI')}
              >
                <Smartphone size={16} /> BHIM UPI
              </button>
              <button
                type="button"
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: paymentMethod === 'Card' ? 'var(--text-ink)' : 'var(--bg-cream)',
                  color: paymentMethod === 'Card' ? 'var(--bg-cream)' : 'var(--text-ink)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'var(--transition-fast)',
                  opacity: isProcessing ? 0.6 : 1
                }}
                onClick={() => setPaymentMethod('Card')}
              >
                <CreditCard size={16} /> Cards (RuPay/Visa)
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              {/* UPI Form */}
              {paymentMethod === 'UPI' && (
                <div>
                  {/* UPI QR Code Visualizer */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-cream)',
                    border: '1px solid var(--border-subtle)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      width: '140px',
                      height: '140px',
                      backgroundColor: '#ffffff',
                      border: '6px solid #111',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: 'var(--shadow-subtle)'
                    }}>
                      <QrCode size={110} strokeWidth={1.5} color="#111" />
                      <div style={{
                        position: 'absolute',
                        width: '26px',
                        height: '26px',
                        backgroundColor: '#ffffff',
                        border: '2px solid #003893',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        color: '#003893'
                      }}>
                        UPI
                      </div>
                    </div>
                    
                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginTop: '1rem',
                      textAlign: 'center',
                      lineHeight: '1.4'
                    }}>
                      Scan QR Code using any UPI App<br />
                      <strong style={{ color: 'var(--text-ink)' }}>(Google Pay, PhonePe, Paytm, BHIM)</strong>
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Enter UPI ID (for verification)</label>
                    <input
                      type="text"
                      disabled={isProcessing}
                      className="form-input"
                      required={paymentMethod === 'UPI'}
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="abhisekh@okaxis"
                    />
                  </div>
                </div>
              )}

              {/* Card Form */}
              {paymentMethod === 'Card' && (
                <div>
                  <div className="card-visualizer">
                    <div className="flex-between">
                      <span className="card-brand">KAAR RuPay</span>
                      <CreditCard size={24} />
                    </div>
                    <div className="card-number-display">
                      {payment.number || '•••• •••• •••• ••••'}
                    </div>
                    <div className="card-details-row">
                      <div>
                        <div>Card Holder</div>
                        <div className="card-val">{payment.name || 'YOUR NAME'}</div>
                      </div>
                      <div>
                        <div>Expires</div>
                        <div className="card-val">{payment.expiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cardholder Name</label>
                    <input
                      type="text"
                      name="name"
                      disabled={isProcessing}
                      className="form-input"
                      required={paymentMethod === 'Card'}
                      value={payment.name}
                      onChange={handlePaymentChange}
                      placeholder="Abhishek Patil"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input
                      type="text"
                      name="number"
                      disabled={isProcessing}
                      className="form-input"
                      required={paymentMethod === 'Card'}
                      value={payment.number}
                      onChange={handlePaymentChange}
                      placeholder="6071 2222 3333 4444"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Expiry Date</label>
                      <input
                        type="text"
                        name="expiry"
                        disabled={isProcessing}
                        className="form-input"
                        required={paymentMethod === 'Card'}
                        value={payment.expiry}
                        onChange={handlePaymentChange}
                        placeholder="MM/YY"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">CVV / CVC</label>
                      <input
                        type="password"
                        name="cvv"
                        disabled={isProcessing}
                        className="form-input"
                        required={paymentMethod === 'Card'}
                        value={payment.cvv}
                        onChange={handlePaymentChange}
                        placeholder="•••"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="form-submit-btn" disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                    Verifying Transaction...
                  </>
                ) : (
                  `Pay ₹${total}`
                )}
              </button>
              
              <button 
                type="button" 
                className="form-submit-btn" 
                style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', marginTop: '0.5rem' }} 
                onClick={() => setStep(1)}
                disabled={isProcessing}
              >
                Back to Delivery
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="success-checkout">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={64} strokeWidth={1.5} />
            </div>
            <h2 className="form-title" style={{ fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Order Placed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 300 }}>
              Dhanyavaad! Thank you for supporting Indian heritage craftsmanship. Your order is being processed.
            </p>
            <div style={{
              backgroundColor: 'var(--bg-cream)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              textAlign: 'left',
              marginBottom: '2rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>Transaction Successful</span>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-muted)' }}>Deliver to</span>
                <span style={{ fontWeight: 500 }}>{shipping.city}, {shipping.country}</span>
              </div>
            </div>
            <button className="form-submit-btn" onClick={resetForm}>
              Continue Browsing
            </button>
            <button 
              className="form-submit-btn" 
              style={{ backgroundColor: 'transparent', color: 'var(--text-ink)', border: '1px solid var(--border-subtle)', marginTop: '0.5rem' }}
              onClick={() => {
                resetForm();
                onOpenOrders();
              }}
            >
              View Order History
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CheckoutModal;
