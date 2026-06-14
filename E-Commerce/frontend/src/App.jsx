import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import ProductDetailModal from './components/ProductDetailModal';
import OrdersModal from './components/OrdersModal';
import Toast from './components/Toast';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';

const App = () => {
  const { 
    products, 
    loading, 
    filters, 
    setFilters, 
    cartOpen, 
    user, 
    wasCheckoutTriggered, 
    setWasCheckoutTriggered 
  } = useApp();

  // Modals visibility states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  // Search local state to allow fast typing before filtering
  const [searchText, setSearchText] = useState(filters.search);

  // Price local state to allow smooth slider movements
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchText }));
  };

  const handleCategorySelect = (category) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const handlePriceChange = (e) => {
    setLocalMaxPrice(Number(e.target.value));
  };

  // Debounce filter updating for smooth sliding experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, maxPrice: localMaxPrice }));
    }, 250);
    return () => clearTimeout(timer);
  }, [localMaxPrice]);

  // UX Body Scroll Lock
  useEffect(() => {
    const isAnyModalOpen = cartOpen || selectedProduct || isAuthOpen || isCheckoutOpen || isOrdersOpen;
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [cartOpen, selectedProduct, isAuthOpen, isCheckoutOpen, isOrdersOpen]);

  // UX Restore checkout state after authentication
  useEffect(() => {
    if (user && wasCheckoutTriggered) {
      setWasCheckoutTriggered(false);
      setIsCheckoutOpen(true);
    }
  }, [user, wasCheckoutTriggered]);

  const categories = ['All', 'Decor', 'Textiles', 'Wellness'];

  return (
    <>
      {/* Navigation */}
      <Navbar 
        onOpenAuth={() => setIsAuthOpen(true)} 
        onOpenOrders={() => setIsOrdersOpen(true)}
      />

      {/* Hero Header */}
      <header className="hero container">
        <p className="hero-subtitle">Curated Indian Art & Craft</p>
        <h1 className="hero-title">Heritage craft, modern aesthetic.</h1>
        <p className="hero-description">
          A collection of premium lifestyle objects, handwoven textiles, and wellness goods sourced directly from heritage artisan clusters across India.
        </p>
      </header>

      {/* Main Shop Layout */}
      <main className="container shop-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          {/* Search bar */}
          <div className="filter-section">
            <h3 className="filter-title">Search</h3>
            <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
              <input
                type="text"
                placeholder="Find an object..."
                className="search-input"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Search className="search-icon" size={16} />
            </form>
          </div>

          {/* Categories */}
          <div className="filter-section">
            <h3 className="filter-title">Collections</h3>
            <div className="category-list">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${filters.category === cat ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <h3 className="filter-title">Price Range</h3>
            <div className="price-slider-wrapper">
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={localMaxPrice}
                onChange={handlePriceChange}
                className="price-slider"
              />
              <div className="price-labels">
                <span>₹0</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>
                  Up to ₹{localMaxPrice}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid / Listings */}
        <section className="products-container">
          <div className="flex-between">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Showing {products.length} design objects
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '6rem 0' }}>
              <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)' }}>
                Curating catalogue objects...
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <Sparkles size={32} style={{ margin: '0 auto 1.5rem', color: 'var(--accent-gold)' }} />
              <h3>No objects found</h3>
              <p style={{ marginTop: '0.5rem' }}>Try adjusting your search criteria or price boundaries.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onSelectProduct={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-logo">KAAR</div>
          <p style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            © {new Date().getFullYear()} KAAR Studio. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Drawers and Modals */}
      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />
      
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOpenAuth={() => {
          setIsCheckoutOpen(false);
          setIsAuthOpen(true);
        }}
        onOpenOrders={() => {
          setIsCheckoutOpen(false);
          setIsOrdersOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      {/* Notifications system */}
      <Toast />
    </>
  );
};

export default App;
