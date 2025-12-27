'use client';
import { useCart } from '@/contexts/CartContext';
import CartItemCard from './CartItemCard';
import { useEffect, useState } from 'react';

interface CartPopupProps {
  themeColors: {
    primary: string;
    secondary: string;
  };
  cardStyle: {
    className: string;
    shadow: string;
    border: string;
    special: string;
  };
  contactMessage?: string;
  whatsappNumber?: string;
  isAcceptingOrders?: boolean;
  isAcceptingOrdersViaWhatsapp?: boolean;
  isAcceptingTableOrders?: boolean;
  tableNumber?: number | null;
  adminId: string;
}

export default function CartPopup({ themeColors, cardStyle, contactMessage, whatsappNumber, isAcceptingOrders, isAcceptingOrdersViaWhatsapp, isAcceptingTableOrders, tableNumber, adminId }: CartPopupProps) {
  const {
    cart,
    getTotalPrice,
    getTotalDiscount,
    isCartOpen,
    setIsCartOpen,
    clearCart,
  } = useCart();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [orderType, setOrderType] = useState<'website' | 'whatsapp' | 'table'>('website');
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // دالة لحفظ الطلب في قاعدة البيانات
  const saveOrder = async (type: 'website' | 'whatsapp', name?: string, phone?: string) => {
    setIsLoading(true);
    try {
      // تحويل عناصر السلة وإزالة id
      const orderItems = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        ...(item.discountedPrice && { discountedPrice: item.discountedPrice }),
        ...(item.imageUrl && { imageUrl: item.imageUrl }),
      }));

      const orderData = {
        adminId,
        orderType: type,
        items: orderItems,
        totalPrice: getTotalPrice(),
        totalDiscount: getTotalDiscount(),
        ...(name && { customerName: name }),
        ...(phone && { customerPhone: phone }),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const savedOrder = await response.json();
        console.log('Order saved successfully', savedOrder);
        setOrderType(type);
        setShowCustomerForm(false);
        setIsCartOpen(false);
        setShowConfirmation(true);
        // لا نحذف السلة تلقائياً - سيكون هناك زر في رسالة التأكيد
        return savedOrder.id;
      } else {
        console.error('Failed to save order');
        alert('فشل حفظ الطلب. يرجى المحاولة مرة أخرى.');
        return null;
      }
    } catch (error) {
      console.error('Error saving order:', error);
      alert('حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const saveTableOrder = async (tableNum: number) => {
    setIsLoading(true);
    try {
      // تحويل عناصر السلة وإزالة id
      const orderItems = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        ...(item.discountedPrice && { discountedPrice: item.discountedPrice }),
        ...(item.imageUrl && { imageUrl: item.imageUrl }),
      }));

      const orderData = {
        adminId,
        tableNumber: tableNum,
        items: orderItems,
        totalPrice: getTotalPrice(),
        totalDiscount: getTotalDiscount(),
      };

      const response = await fetch('/api/table-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const savedOrder = await response.json();
        console.log('Table order saved successfully', savedOrder);
        setIsCartOpen(false);
        setShowConfirmation(true);
        // لا نحذف السلة تلقائياً - سيكون هناك زر في رسالة التأكيد
        return savedOrder.id;
      } else {
        console.error('Failed to save table order');
        alert('فشل حفظ الطلب. يرجى المحاولة مرة أخرى.');
        return null;
      }
    } catch (error) {
      console.error('Error saving table order:', error);
      alert('حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // دالة لتحويل روابط واتساب إلى أرقام قابلة للنقر
  const renderContactMessage = (message: string) => {
    // البحث عن روابط واتساب بالصيغتين: wa.me/رقم أو https://wa.me/رقم
    const waRegex = /(https?:\/\/)?wa\.me\/(\+?\d+)/g;
    const parts = message.split(waRegex);

    return parts.map((part, index) => {
      // التحقق إذا كان هذا الجزء هو الرقم (يأتي بعد wa.me/)
      if (part && /^\+?\d+$/.test(part)) {
        return (
          <a
            key={index}
            href={`https://wa.me/${part}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline transition-colors inline-flex items-center gap-1 align-middle"
            style={{ color: themeColors.primary, verticalAlign: 'middle' }}
          >
            <svg className="w-5 h-5 inline-block" fill="currentColor" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span style={{ verticalAlign: 'middle' }}>{part}</span>
          </a>
        );
      }
      // إذا لم يكن رقم، نرجع النص العادي
      return part ? <span key={index}>{part}</span> : null;
    });
  };

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  const totalPrice = getTotalPrice();
  const totalDiscount = getTotalDiscount();

  return (
    <>
      {/* Cart Popup - Only when cart is open */}
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[50]"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Popup */}
          <div className="fixed inset-0 z-[51] flex items-center justify-center p-4">
            <div
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Header */}
              <div
                className="p-6 flex justify-between items-center rounded-t-[2.5rem]"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                }}
              >
                <h2 className="text-2xl font-bold text-white">السلة</h2>
                <div className="flex items-center gap-3">
                  {cart.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من تفريغ السلة؟')) {
                          clearCart();
                        }
                      }}
                      className="text-white hover:text-gray-200 transition-colors"
                      title="تفريغ السلة"
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                    title="إغلاق"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cart Items - Fixed Height with Scroll */}
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-gray-500 text-lg">السلة فارغة</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {cart.map((item) => (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        themeColors={themeColors}
                        cardStyle={cardStyle}
                        imageUrl={item.imageUrl}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer - Fixed */}
              {cart.length > 0 && (
                <div className="border-t-2 border-gray-200 p-6 bg-gray-50 rounded-b-[2.5rem]">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    {/* Price Summary */}
                    <div className="flex-1 bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center">
                      <div className="w-full">
                        {totalDiscount > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 font-medium">الإجمالي</span>
                              <span className="text-gray-700 font-bold">
                                {(totalPrice + totalDiscount) % 1 === 0 ? (totalPrice + totalDiscount).toFixed(0) : (totalPrice + totalDiscount).toFixed(2)} جـ
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-green-600 font-medium">الخصم</span>
                              <span className="text-green-600 font-bold">
                                {totalDiscount % 1 === 0 ? totalDiscount.toFixed(0) : totalDiscount.toFixed(2)} جـ
                              </span>
                            </div>
                            <div className="border-t-2 border-gray-200 pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-900 font-bold text-lg">الإجمالي النهائي</span>
                                <span className="font-black text-2xl" style={{ color: themeColors.primary }}>
                                  {totalPrice % 1 === 0 ? totalPrice.toFixed(0) : totalPrice.toFixed(2)} جـ
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-900 font-bold text-lg">الإجمالي النهائي</span>
                            <span className="font-black text-2xl" style={{ color: themeColors.primary }}>
                              {totalPrice % 1 === 0 ? totalPrice.toFixed(0) : totalPrice.toFixed(2)} جـ
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Buttons */}
                    <div className="flex-1 flex flex-col gap-3">
                      {/* Table Order Button - يظهر فقط عند وجود رقم طاولة */}
                      {tableNumber && isAcceptingTableOrders ? (
                        <button
                          onClick={async () => {
                            const orderId = await saveTableOrder(tableNumber);
                            if (orderId) {
                              setShowConfirmation(true);
                              setOrderType('table');
                            }
                          }}
                          disabled={isLoading}
                          className="flex-1 w-full py-3 text-white font-bold rounded-2xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                          style={{
                            background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                          }}
                        >
                          {isLoading ? '. . .' :"ارسال الطلب"}
                        </button>
                      ) : (
                        <>
                          {/* Website Order Button */}
                          {isAcceptingOrders && (
                            <button
                              onClick={() => {
                                setIsCartOpen(false);
                                setShowCustomerForm(true);
                              }}
                              className="flex-1 w-full py-3 text-white font-bold rounded-2xl transition-all transform hover:scale-105 shadow-lg"
                              style={{
                                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                              }}
                            >
                              اطلب الآن عبر الموقع
                            </button>
                          )}

                          {/* WhatsApp Order Button */}
                          {isAcceptingOrdersViaWhatsapp && whatsappNumber && (
                            <button
                              onClick={async () => {
                                const orderId = await saveOrder('whatsapp');
                                if (orderId) {
                                  const message = `مرحباً، أود طلب:\n${cart.map(item => `- ${item.name} (${item.quantity})`).join('\n')}\n\nالإجمالي: ${getTotalPrice()} جـ\n\nرقم الطلب: ${orderId.replace('order_', '')}`;
                                  window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                }
                              }}
                              disabled={isLoading}
                              className="flex-1 w-full py-3 font-bold rounded-2xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: '#25D366',
                                color: '#FFFFFF'
                              }}
                              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#20BA5A')}
                              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#25D366')}
                            >
                              {isLoading ? (
                                '. . .'
                              ) : (
                                <>
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                  </svg>
                                  اطلب من خلال واتساب
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}

                      {/* Contact Message - يظهر فقط إذا لم تكن هناك خيارات طلب */}
                      {!tableNumber && !isAcceptingOrders && !isAcceptingOrdersViaWhatsapp && contactMessage && (
                        <div
                          className={`flex-1 w-full bg-gradient-to-r from-blue-50 to-purple-50 p-5 ${cardStyle.className} ${cardStyle.border} ${cardStyle.shadow} flex items-center`}
                          style={{
                            ...(cardStyle.special === 'theme-border' && { borderColor: themeColors.primary }),
                            ...(cardStyle.special === 'theme-border-dashed' && { borderColor: themeColors.primary }),
                            ...(cardStyle.special !== 'theme-border' && cardStyle.special !== 'theme-border-dashed' && { borderWidth: '2px', borderColor: '#bfdbfe' })
                          }}
                        >
                          <div className="text-gray-800 text-center whitespace-pre-line leading-relaxed font-medium w-full">
                            {renderContactMessage(contactMessage)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Customer Form Popup */}
      {showCustomerForm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => {
              setShowCustomerForm(false);
              setCustomerName('');
              setCustomerPhone('');
            }}
          />

          {/* Customer Form */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Header */}
              <div
                className="p-6 mb-6 rounded-3xl"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                }}
              >
                <h2 className="text-2xl font-bold text-white text-center">إدخال بيانات العميل</h2>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 mb-6">
                {/* Name Input */}
                <div>
                  <label className="block text-gray-700 font-bold mb-2">الاسم</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="أدخل اسمك"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none transition-colors text-gray-800"
                    onFocus={(e) => {
                      e.target.style.borderColor = themeColors.primary;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-gray-700 font-bold mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="أدخل رقم الهاتف"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none transition-colors text-gray-800"
                    onFocus={(e) => {
                      e.target.style.borderColor = themeColors.primary;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>
              </div>

              {/* Send Order Button */}
              <button
                onClick={async () => {
                  if (!customerName.trim() || !customerPhone.trim()) {
                    alert('الرجاء إدخال الاسم ورقم الهاتف');
                    return;
                  }
                  await saveOrder('website', customerName, customerPhone);
                  setCustomerName('');
                  setCustomerPhone('');
                }}
                disabled={isLoading}
                className="w-full py-4 text-white font-bold rounded-2xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                }}
              >
                {isLoading ? '. . .' : 'إرسال الطلب'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Popup */}
      {showConfirmation && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => {
              setShowConfirmation(false);
              setIsCartOpen(false);
            }}
          />

          {/* Confirmation Message */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-12 text-center"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Success Icon Circle */}
              <div
                className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                }}
              >
                <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Main Message */}
              <h2 className="text-3xl font-black text-gray-800 mb-4">
                تم تسجيل طلبك
              </h2>

              {/* Secondary Message - Only for WhatsApp orders */}
              {orderType === 'whatsapp' && (
                <p className="text-base text-gray-600 leading-relaxed mb-2">
                  تأكد من اكتمال ارسال الرسالة عبر واتساب لنتمكن من التواصل معك
                </p>
              )}

              {/* Buttons - حسناً وحسناً أفرغ السلة */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => {
                    clearCart();
                    setShowConfirmation(false);
                    setIsCartOpen(false);
                  }}
                  className="w-full px-8 py-3 text-white font-bold rounded-2xl transition-all transform hover:scale-105 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                  }}
                >
                  حسناً، أفرغ السلة
                </button>

                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setIsCartOpen(false);
                  }}
                  className="w-full px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl transition-all transform hover:scale-105 shadow-md"
                >
                  حسناً
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Price Strikethrough Style */}
      <style jsx>{`
        .price-strikethrough {
          position: relative;
          display: inline-block;
        }
        .price-strikethrough::after {
          content: '';
          position: absolute;
          left: -10%;
          right: -10%;
          top: 50%;
          transform: translateY(-50%) rotate(15deg);
          height: 1.5px;
          background-color: currentColor;
        }
      `}</style>
    </>
  );
}
