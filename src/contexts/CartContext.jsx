import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [groupSize, setGroupSize] = useState('individual');

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('foodieshub_cart');
    const savedGroupSize = localStorage.getItem('foodieshub_groupSize');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    if (savedGroupSize) {
      setGroupSize(savedGroupSize);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('foodieshub_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('foodieshub_groupSize', groupSize);
  }, [groupSize]);

  const addToCart = (foodItem, quantity = 1, selectedVariants = {}) => {
    setCartItems((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.foodId === foodItem.foodId &&
          JSON.stringify(item.variants) === JSON.stringify(selectedVariants)
      );

      if (existingItem) {
        return prev.map((item) =>
          item.foodId === foodItem.foodId &&
          JSON.stringify(item.variants) === JSON.stringify(selectedVariants)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          foodId: foodItem.foodId,
          foodName: foodItem.name,
          price: foodItem.price,
          imageUrl: foodItem.imageUrl,
          storeId: foodItem.storeId,
          variants: selectedVariants,
          quantity,
        },
      ];
    });
  };

  const removeFromCart = (foodId, variants = {}) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(item.foodId === foodId && JSON.stringify(item.variants) === JSON.stringify(variants))
      )
    );
  };

  const updateQuantity = (foodId, quantity, variants = {}) => {
    if (quantity <= 0) {
      removeFromCart(foodId, variants);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.foodId === foodId && JSON.stringify(item.variants) === JSON.stringify(variants)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    groupSize,
    setGroupSize,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

