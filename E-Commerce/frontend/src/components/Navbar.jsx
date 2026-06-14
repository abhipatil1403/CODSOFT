import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, User, Sun, Moon, LogOut } from 'lucide-react';

const Navbar = ({ onOpenAuth, onOpenOrders }) => {
  const { cart, setCartOpen, user, logout } = useApp();
  const [theme, setTheme] = useState(localStorage.getItem('kaar_theme_mode') || 'light');
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle dark mode toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kaar_theme_mode', theme);
  }, [theme]);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container flex-between nav-container">
        <a href="#" className="nav-brand">
          KAAR
          <span>STUDIO</span>
        </a>

        <div className="nav-actions">
          {/* Theme Toggle */}
          <button className="nav-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Cart Trigger */}
          <button className="nav-btn" onClick={() => setCartOpen(true)} aria-label="Open Shopping Bag">
            <ShoppingBag size={20} />
            {cartItemsCount > 0 && <span className="badge">{cartItemsCount}</span>}
          </button>

          {/* User Auth Info / Actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={onOpenOrders} 
                style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--text-muted)', 
                  fontWeight: 500,
                  borderBottom: '1px solid transparent'
                }}
                onMouseOver={e => e.target.style.borderBottomColor = 'var(--text-muted)'}
                onMouseOut={e => e.target.style.borderBottomColor = 'transparent'}
              >
                {user.name}
              </button>
              <button className="nav-btn" onClick={logout} title="Sign Out">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button className="nav-btn" onClick={onOpenAuth} title="Sign In">
              <User size={20} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
