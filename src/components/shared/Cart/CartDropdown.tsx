import React, { useState, useRef, useEffect } from "react";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useGlobalState } from "../../../context/GlobalStateContext";

export const CartDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useGlobalState();
  const { cart } = state;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id: itemId, quantity: newQuantity } });
    }
  };

  const handleClearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-10 h-10 rounded-md border bg-[var(--surface-control)] border-[color:var(--border-subtle)] hover:bg-[var(--surface-control-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] transition-colors duration-200"
        aria-label="Shopping Cart"
      >
        <ShoppingCart className="w-4 h-4 text-[var(--text-secondary)]" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full">
            {totalItems > 9 ? "9+" : totalItems}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-96 bg-[var(--surface-popover)] rounded-lg shadow-xl border border-[color:var(--border-subtle)] z-50 max-h-[600px] overflow-hidden flex flex-col transition-colors duration-300">
          {/* Header */}
          <div className="p-4 border-b border-[color:var(--border-subtle)] bg-[var(--surface-control-muted)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                سلة التسوق
              </h3>
              {cart.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {totalItems} منتج
                  </span>
                  <button
                    onClick={handleClearCart}
                    className="text-xs text-red-500 hover:text-red-400 hover:underline transition-colors duration-200"
                  >
                    إفراغ السلة
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="overflow-y-auto flex-1">
            {cart.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-[var(--text-tertiary)]/40 mx-auto mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">
                  السلة فارغة
                </p>
                <p className="text-xs text-[var(--text-tertiary)]/80 mt-1">
                  أضف منتجات من المتجر
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[color:var(--border-subtle)]">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-[var(--surface-control-muted)] transition-colors duration-150"
                  >
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-[var(--surface-control)] rounded-md flex-shrink-0 overflow-hidden border border-[color:var(--border-subtle)]">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-[var(--text-tertiary)]/70" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 text-right truncate transition-colors duration-300">
                          {item.title}
                        </h4>
                        {item.category && (
                          <p className="text-xs text-orange-500 text-right mb-2">
                            {item.category}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-[var(--surface-control)] hover:bg-[var(--surface-control-hover)] rounded transition-colors border border-[color:var(--border-subtle)]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3 text-[var(--text-secondary)]" />
                            </button>
                            <span className="text-sm font-medium text-[var(--text-secondary)] w-8 text-center transition-colors duration-300">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-[var(--surface-control)] hover:bg-[var(--surface-control-hover)] rounded transition-colors border border-[color:var(--border-subtle)]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3 text-[var(--text-secondary)]" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-color-mode-text-icons-t-blue">
                              {(item.price * item.quantity).toFixed(2)}
                            </span>
                            <span className="text-xs text-color-mode-text-icons-t-blue">ر.س</span>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="flex-shrink-0 p-1 hover:bg-red-500/10 rounded transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Total and Checkout */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-[color:var(--border-subtle)] bg-[var(--surface-control-muted)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  الإجمالي:
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-color-mode-text-icons-t-blue">
                    {totalPrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-color-mode-text-icons-t-blue">ر.س</span>
                </div>
              </div>
              <button
                className="w-full py-2.5 bg-color-mode-surface-primary-blue hover:opacity-90 text-white font-medium rounded-md transition-all duration-200"
                onClick={() => {
                  // TODO: Implement checkout
                  console.log("Proceed to checkout", cart);
                }}
              >
                إتمام الطلب
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

