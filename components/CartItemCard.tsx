'use client';
import { useCart } from '@/contexts/CartContext';

interface CartItemCardProps {
  item: {
    id: string;
    name: string;
    price: number;
    discountedPrice?: number;
    quantity: number;
  };
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
  imageUrl?: string;
}

export default function CartItemCard({ item, themeColors, cardStyle, imageUrl }: CartItemCardProps) {
  const { cart, updateQuantity, removeFromCart } = useCart();

  const cartItem = cart.find(ci => ci.id === item.id);
  const quantity = cartItem?.quantity || 0;
  const discountPercentage = item.discountedPrice
    ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
    : 0;

  return (
    <div
      className={`group relative ${cardStyle.className} overflow-hidden ${cardStyle.shadow} ${cardStyle.border} transition-all duration-300 bg-white`}
      style={{
        ...(cardStyle.special === 'theme-border' && { borderColor: themeColors.primary }),
        ...(cardStyle.special === 'theme-border-dashed' && { borderColor: themeColors.primary })
      }}
    >
      <div className="flex flex-row h-48">
        {/* Discount Badge */}
        {item.discountedPrice && (
          <div
            className={`absolute ${imageUrl ? 'top-4 left-4 text-left' : 'left-0 top-2 w-1/2 text-center'} animate-pulse z-20`}
            style={{
              color: '#fff',
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              fontWeight: '900',
              animationDuration: '1.5s'
            }}
          >
            {imageUrl ? (
              <>
                <div className="text-3xl font-black">خصم</div>
                <div className="text-4xl font-black">{discountPercentage}%</div>
              </>
            ) : (
              <div className="text-3xl font-black whitespace-nowrap">خصم {discountPercentage}%</div>
            )}
          </div>
        )}

        {/* Left Side - Content */}
        <div className="flex-1 pr-5 pl-3 py-5 flex flex-col justify-center items-start text-right" dir="rtl">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {item.name}
          </h3>
        </div>

        {/* Right Side - Image or Placeholder */}
        <div className="relative w-1/2">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
              }}
            />
          )}
        </div>

        {/* Center Circle - Absolute positioned */}
        <div className={`absolute z-10 ${imageUrl ? 'left-2 bottom-2' : 'left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}>
          {item.discountedPrice ? (
            <div
              className="min-w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white px-2"
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
              }}
            >
              <div className="text-white text-base font-bold leading-none">جــــ</div>
              <div className="text-white text-3xl font-black whitespace-nowrap leading-none">
                {Number(item.discountedPrice) % 1 === 0
                  ? Number(item.discountedPrice).toFixed(0)
                  : Number(item.discountedPrice).toFixed(2)}
              </div>
              <div className="text-white text-sm font-bold price-strikethrough opacity-80 whitespace-nowrap leading-none">
                {Number(item.price) % 1 === 0
                  ? Number(item.price).toFixed(0)
                  : Number(item.price).toFixed(2)}
              </div>
            </div>
          ) : (
            <div
              className="min-w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white px-2"
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
              }}
            >
              <div className="text-white text-base font-bold leading-none">جــــ</div>
              <div className="text-white text-3xl font-black whitespace-nowrap leading-none">
                {Number(item.price) % 1 === 0
                  ? Number(item.price).toFixed(0)
                  : Number(item.price).toFixed(2)}
              </div>
              <div className="text-white text-sm font-bold opacity-0 whitespace-nowrap leading-none">0</div>
            </div>
          )}
        </div>

        {/* Add to Cart Control */}
        <div
          className="absolute bottom-2 right-2 h-7 text-white rounded-full flex items-center shadow-lg z-20"
          style={{
            background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
          }}
        >
          {quantity > 0 ? (
            <>
              {/* Increase Button */}
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="w-7 h-7 flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Quantity Display */}
              <div className="px-2 text-sm font-bold min-w-[1.5rem] text-center">
                {quantity}
              </div>

              {/* Decrease Button */}
              <button
                onClick={() => {
                  if (quantity === 1) {
                    removeFromCart(item.id);
                  } else {
                    updateQuantity(item.id, quantity - 1);
                  }
                }}
                className="w-7 h-7 flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
              </button>
            </>
          ) : null}
        </div>
      </div>

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
    </div>
  );
}
