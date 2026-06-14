import React, { createContext, useState, useEffect, useContext, useRef } from 'react';

const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kaar_token') || null);
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('kaar_cart')) || []);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Track if a login was requested during a checkout flow
  const [wasCheckoutTriggered, setWasCheckoutTriggered] = useState(false);

  // Custom toast notifications
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Filters state
  const [filters, setFilters] = useState({
    category: 'All',
    search: '',
    minPrice: 0,
    maxPrice: 5000
  });

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Sync token with local storage
  useEffect(() => {
    if (token) {
      localStorage.setItem('kaar_token', token);
      fetchUserData();
    } else {
      localStorage.removeItem('kaar_token');
      setUser(null);
    }
  }, [token]);

  // Sync cart with local storage
  useEffect(() => {
    localStorage.setItem('kaar_cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { category, search, minPrice, maxPrice } = filters;
      let url = `${API_URL}/products?minPrice=${minPrice}&maxPrice=${maxPrice}`;
      if (category && category !== 'All') {
        url += `&category=${category}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        showToast('Failed to load products', 'error');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      showToast('Backend connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch current logged in user details
  const fetchUserData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Token might have expired
        logout();
      }
    } catch (error) {
      console.error('Fetch user data error:', error);
    }
  };

  // Trigger product fetch when filters change
  useEffect(() => {
    fetchProducts();
  }, [filters]);

  // Auth Operations
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        showToast(`Welcome back, ${data.user.name}!`);
        return { success: true };
      } else {
        showToast(data.message || 'Login failed', 'error');
        return { success: false, message: data.message };
      }
    } catch (error) {
      showToast('Network error during login', 'error');
      return { success: false, message: 'Server unreachable' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        showToast(`Account created! Welcome, ${data.user.name}`);
        return { success: true };
      } else {
        showToast(data.message || 'Registration failed', 'error');
        return { success: false, message: data.message };
      }
    } catch (error) {
      showToast('Network error during registration', 'error');
      return { success: false, message: 'Server unreachable' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWasCheckoutTriggered(false);
    showToast('Logged out successfully', 'info');
  };

  // Cart Operations
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product === product._id);
      if (existingItem) {
        showToast(`Updated quantity of ${product.name}`);
        return prevCart.map((item) =>
          item.product === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      showToast(`Added ${product.name} to cart`);
      return [...prevCart, {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1
      }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const item = prevCart.find(i => i.product === productId);
      if (item) showToast(`Removed ${item.name} from cart`, 'info');
      return prevCart.filter((item) => item.product !== productId);
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Place Order / Checkout
  const placeOrder = async (shippingAddress, paymentMethod) => {
    if (!user) {
      showToast('Please sign in to place an order', 'error');
      return { success: false, message: 'Authentication required' };
    }

    try {
      const orderData = {
        items: cart,
        shippingAddress,
        paymentMethod,
        totalPrice: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Order placed successfully!', 'success');
        clearCart();
        return { success: true, order: data };
      } else {
        showToast(data.message || 'Order failed', 'error');
        return { success: false, message: data.message };
      }
    } catch (error) {
      showToast('Checkout transaction failed', 'error');
      return { success: false, message: 'Server unreachable' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        loading,
        user,
        token,
        cart,
        cartOpen,
        setCartOpen,
        toast,
        showToast,
        filters,
        setFilters,
        login,
        register,
        logout,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        placeOrder,
        fetchProducts,
        wasCheckoutTriggered,
        setWasCheckoutTriggered
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
