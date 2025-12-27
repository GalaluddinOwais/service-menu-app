'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  quantity: number;
  imageUrl?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalDiscount: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, tableNumber, adminUsername }: { children: ReactNode; tableNumber?: number | null; adminUsername: string }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // تحديد مفتاح localStorage حسب نوع الصفحة
  const CART_STORAGE_KEY = tableNumber ? `menu_cart_table_${tableNumber}_${adminUsername}` : `menu_cart_${adminUsername}`;

  // تحميل السلة من localStorage عند بدء التطبيق أو تغيير رقم الطاولة
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    } else {
      setCart([]);
    }
  }, [CART_STORAGE_KEY]);

  // حفظ السلة في localStorage عند كل تغيير
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, CART_STORAGE_KEY]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);

      if (existingItem) {
        // زيادة الكمية إذا كان العنصر موجود
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        // إضافة عنصر جديد
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });

    // لا تفتح السلة تلقائياً
    // setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.discountedPrice || item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const getTotalDiscount = () => {
    return cart.reduce((total, item) => {
      if (item.discountedPrice) {
        const discount = (item.price - item.discountedPrice) * item.quantity;
        return total + discount;
      }
      return total;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalDiscount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
