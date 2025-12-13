'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Admin {
  id: string;
  username: string;
  logoUrl?: string;
  backgroundUrl?: string;
  theme: 'ocean' | 'sunset' | 'forest' | 'royal' | 'rose';
  welcomeMessage?: string;
  contactMessage?: string;
}

interface MenuList {
  id: string;
  name: string;
  itemType: string;
  adminId: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
  description?: string;
  listId: string;
}

const THEMES = {
  ocean: {
    name: 'المحيط',
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    gradient: 'from-cyan-400 via-blue-500 to-blue-600',
    accent: '#3b82f6'
  },
  sunset: {
    name: 'الغروب',
    primary: '#f97316',
    secondary: '#fb923c',
    gradient: 'from-orange-400 via-red-500 to-pink-600',
    accent: '#dc2626'
  },
  forest: {
    name: 'الغابة',
    primary: '#10b981',
    secondary: '#34d399',
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
    accent: '#059669'
  },
  royal: {
    name: 'الملكي',
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    gradient: 'from-purple-400 via-violet-500 to-purple-600',
    accent: '#7c3aed'
  },
  rose: {
    name: 'الوردي',
    primary: '#ec4899',
    secondary: '#f472b6',
    gradient: 'from-pink-400 via-rose-500 to-pink-600',
    accent: '#db2777'
  },
  midnight: {
    name: 'منتصف الليل',
    primary: '#1e293b',
    secondary: '#475569',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    accent: '#0f172a'
  },
  coral: {
    name: 'المرجان',
    primary: '#ff6b6b',
    secondary: '#ff8787',
    gradient: 'from-red-400 via-red-500 to-rose-600',
    accent: '#fa5252'
  },
  emerald: {
    name: 'الزمرد',
    primary: '#2dd4bf',
    secondary: '#5eead4',
    gradient: 'from-teal-400 via-cyan-500 to-teal-600',
    accent: '#14b8a6'
  },
  lavender: {
    name: 'الخزامى',
    primary: '#a78bfa',
    secondary: '#c4b5fd',
    gradient: 'from-violet-400 via-purple-500 to-indigo-600',
    accent: '#8b5cf6'
  },
  crimson: {
    name: 'القرمزي',
    primary: '#dc2626',
    secondary: '#ef4444',
    gradient: 'from-red-500 via-red-600 to-red-700',
    accent: '#b91c1c'
  },
  coffee: {
    name: 'القهوة',
    primary: '#92400e',
    secondary: '#b45309',
    gradient: 'from-amber-800 via-yellow-800 to-amber-900',
    accent: '#78350f'
  },
  canary: {
    name: 'الكناري',
    primary: '#eab308',
    secondary: '#facc15',
    gradient: 'from-yellow-400 via-yellow-500 to-amber-500',
    accent: '#ca8a04'
  },
};

export default function PublicMenuPage() {
  const params = useParams();
  const username = params.username as string;

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [lists, setLists] = useState<MenuList[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchMenuData();
  }, [username]);

  // Typewriter effect for welcome message
  useEffect(() => {
    if (!admin?.welcomeMessage) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    const text = admin.welcomeMessage;

    // تأخير بداية الكتابة 800ms
    const startDelay = setTimeout(() => {
      let currentIndex = 0;
      setDisplayedText('');
      setIsTyping(true);

      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsTyping(false); // إخفاء الكيرسر بعد انتهاء الكتابة
        }
      }, 50); // سرعة الكتابة: 50ms لكل حرف

      return () => clearInterval(interval);
    }, 1500);

    return () => clearTimeout(startDelay);
  }, [admin?.welcomeMessage]);

  const fetchMenuData = async () => {
    try {
      // جلب بيانات الأدمن من الـ public endpoint
      const adminRes = await fetch(`/api/public/admin/${username}`);

      if (!adminRes.ok) {
        setError('لم يتم العثور على هذه القائمة');
        setLoading(false);
        return;
      }

      const foundAdmin = await adminRes.json();
      setAdmin(foundAdmin);

      // جلب القوائم الخاصة بهذا الأدمن
      const listsRes = await fetch(`/api/lists?adminId=${foundAdmin.id}`);
      const listsData = await listsRes.json();
      setLists(Array.isArray(listsData) ? listsData : []);

      // جلب جميع العناصر
      const menuRes = await fetch('/api/menu');
      const menuData = await menuRes.json();
      setItems(Array.isArray(menuData.items) ? menuData.items : []);

      setLoading(false);
    } catch (err) {
      setError('حدث خطأ أثناء تحميل القائمة');
      setLoading(false);
    }
  };

  const getListItems = (listId: string) => {
    return items.filter(item => item.listId === listId);
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
            className="font-bold underline transition-colors inline-flex items-center gap-1"
            style={{ color: theme.primary }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {part}
          </a>
        );
      }
      // تجاهل البروتوكول والنطاق (https://, wa.me/)
      if (part === 'https://' || part === 'http://' || part === 'wa.me/') {
        return null;
      }
      return part ? <span key={index}>{part}</span> : null;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل القائمة...</p>
        </div>
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4" dir="rtl">
        <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">تأكد من صحة الرابط وحاول مرة أخرى</p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
          >
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const theme = THEMES[admin.theme || 'ocean'];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      dir="rtl"
      style={{
        background: admin.backgroundUrl
          ? `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${admin.backgroundUrl}) repeat`
          : `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}30, ${theme.accent}10)`
      }}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute top-0 -right-40 w-80 h-80 bg-gradient-to-br ${theme.gradient} rounded-full mix-blend-multiply filter blur-3xl animate-blob`}></div>
        <div className={`absolute top-0 -left-40 w-80 h-80 bg-gradient-to-br ${theme.gradient} rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000`}></div>
        <div className={`absolute -bottom-40 left-20 w-80 h-80 bg-gradient-to-br ${theme.gradient} rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000`}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          {admin.logoUrl && (
            <div className="mb-3">
              <img
                src={admin.logoUrl}
                alt="Logo"
                className="h-32 w-32 object-contain mx-auto shadow-2xl ring-4 ring-white"
                                style={{ borderRadius: '25px' }}

              />
            </div>
          )}
          {/* Welcome Message */}
          {admin.welcomeMessage && (
            <div className="mt-8 bg-white/95 backdrop-blur-md p-7 rounded-2xl shadow-2xl max-w-3xl mx-auto" >
              <div className="text-gray-900 text-2xl whitespace-pre-line leading-relaxed font-semibold" >
                {displayedText}
                {isTyping && <span className="animate-pulse">|</span>}
              </div>
            </div>
          )}



          <div className="inline-block bg-white/90 backdrop-blur-sm rounded-xl px-8 py-4 mt-6 shadow-lg">
            <p className="text-gray-700 text-2xl font-bold">
              استكشف قوائمنا المميزة
            </p>
          </div>

        </div>

        {lists.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/90 backdrop-blur-sm p-12 rounded-2xl shadow-2xl max-w-md mx-auto">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xl text-gray-600 font-medium">لا توجد قوائم متاحة حالياً</p>
            </div>
          </div>
        ) : (
          <>
            {/* Lists Navigation */}
            <div className="mb-8 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-4">
                <button
                  onClick={() => setSelectedListId(null)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                    selectedListId === null
                      ? `bg-gradient-to-r ${theme.gradient} text-white shadow-xl`
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white'
                  }`}
                >
                  جميع القوائم
                </button>
                <button
                  onClick={() => setSelectedListId('discounts')}
                  className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg whitespace-nowrap ${
                    selectedListId === 'discounts'
                      ? `bg-gradient-to-r ${theme.gradient} text-white shadow-xl`
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white'
                  }`}
                >
                  العروض والخصومات
                </button>
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg whitespace-nowrap ${
                      selectedListId === list.id
                        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-xl`
                        : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white'
                    }`}
                  >
                    {list.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Lists */}
            <div className="grid gap-8">
              {selectedListId === 'discounts' ? (
                // عرض قائمة العروض والخصومات
                (() => {
                  // فلترة العناصر ذات الخصم من قوائم الأدمن الحالي فقط
                  const adminListIds = lists.map(list => list.id);
                  const discountedItems = items.filter(item =>
                    item.discountedPrice && adminListIds.includes(item.listId)
                  );

                  if (discountedItems.length === 0) {
                    return (
                      <div className="text-center py-20">
                        <div className="bg-white/90 backdrop-blur-sm p-12 rounded-2xl shadow-2xl max-w-md mx-auto">
                          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                          <p className="text-xl text-gray-600 font-medium">لا توجد عروض متاحة حالياً</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 animate-slide-up"
                    >
                      {/* List Header */}
                      <div
                        className={`bg-gradient-to-r ${theme.gradient} p-6 text-white`}
                      >
                        <h2 className="text-3xl font-black mb-2">العروض والخصومات</h2>
                        <p className="text-white/90 font-medium">
                          {discountedItems.length} عنصر
                        </p>
                      </div>

                      {/* List Items */}
                      <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          {discountedItems.map((item, itemIdx) => {
                            const discountPercentage = Math.round(((item.price - item.discountedPrice!) / item.price) * 100);

                            return (
                              <div
                                key={item.id}
                                className="group relative bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300"
                                style={{
                                  animation: `slideUp 0.5s ease-out ${itemIdx * 50}ms`
                                }}
                              >
                                {/* Discount Badge */}
                                <div className="absolute -top-2 -left-2 bg-yellow-400 text-black w-11 h-11 rounded-full flex items-center justify-center font-black text-xs shadow-lg animate-fast-pulse">
                                  -{discountPercentage}%
                                </div>

                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors mb-1">
                                      {item.name}
                                    </h3>

                                    {/* Description - first line bold, rest normal */}
                                    {item.description && (
                                      <div className="text-sm text-gray-700 mt-2 leading-relaxed">
                                        {item.description.split('\n').map((line, i) => (
                                          <div key={i} className={i === 0 ? 'font-bold' : ''}>
                                            {line}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-center gap-2 w-1/2">
                                    {/* Price Section */}
                                    <div
                                      className="text-center w-full"
                                      style={{ color: theme.accent }}
                                    >
                                      <div className="text-2xl font-black">
                                        {Number(item.discountedPrice) % 1 === 0
                                          ? Number(item.discountedPrice).toFixed(0)
                                          : Number(item.discountedPrice).toFixed(2)} جـ
                                      </div>
                                      <div className="text-lg mt-1 font-bold" style={{ color: theme.primary }}>
                                        بدلاً من {Number(item.price) % 1 === 0
                                          ? Number(item.price).toFixed(0)
                                          : Number(item.price).toFixed(2)} جـ
                                      </div>
                                    </div>

                                    {/* Item Image - clickable */}
                                    {item.imageUrl && (
                                      <div className="mt-2 w-full h-32">
                                        <img
                                          src={item.imageUrl}
                                          alt={item.name}
                                          onClick={() => setSelectedImage(item.imageUrl!)}
                                          className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Decorative element */}
                                <div
                                  className="h-1 w-0 group-hover:w-full transition-all duration-500 mt-3 rounded-full mx-auto"
                                  style={{ backgroundColor: theme.primary }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Contact Message */}
                        {admin.contactMessage && (
                          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl border-2 border-blue-100">
                            <div className="text-gray-800 text-center whitespace-pre-line leading-relaxed font-medium">
                              {renderContactMessage(admin.contactMessage)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // عرض القوائم العادية
                lists
                  .filter(list => selectedListId === null || list.id === selectedListId)
                  .map((list, idx) => {
                    const listItems = getListItems(list.id);

                    if (listItems.length === 0) return null;

                    return (
                      <div
                        key={list.id}
                        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        {/* List Header */}
                        <div
                          className={`bg-gradient-to-r ${theme.gradient} p-6 text-white`}
                        >
                          <h2 className="text-3xl font-black mb-2">{list.name}</h2>
                          <p className="text-white/90 font-medium">
                            {listItems.length} عنصر
                          </p>
                        </div>

                      {/* List Items */}
                      <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          {listItems.map((item, itemIdx) => {
                            const discountPercentage = item.discountedPrice
                              ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
                              : 0;

                            return (
                              <div
                                key={item.id}
                                className="group relative bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300"
                                style={{
                                  animation: `slideUp 0.5s ease-out ${itemIdx * 50}ms`
                                }}
                              >
                                {/* Discount Badge */}
                                {item.discountedPrice && (
                                  <div className="absolute -top-2 -left-2 bg-yellow-400 text-black w-11 h-11 rounded-full flex items-center justify-center font-black text-xs shadow-lg animate-fast-pulse">
                                    -{discountPercentage}%
                                  </div>
                                )}

                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors mb-1">
                                      {item.name}
                                    </h3>

                                    {/* Description - first line bold, rest normal */}
                                    {item.description && (
                                      <div className="text-sm text-gray-700 mt-2 leading-relaxed">
                                        {item.description.split('\n').map((line, i) => (
                                          <div key={i} className={i === 0 ? 'font-bold' : ''}>
                                            {line}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-center gap-2 w-1/2">
                                    {/* Price Section */}
                                    <div
                                      className="text-center w-full"
                                      style={{ color: theme.accent }}
                                    >
                                      {item.discountedPrice ? (
                                        <>
                                          <div className="text-2xl font-black">
                                            {Number(item.discountedPrice) % 1 === 0
                                              ? Number(item.discountedPrice).toFixed(0)
                                              : Number(item.discountedPrice).toFixed(2)} جـ
                                          </div>
                                          <div className="text-lg mt-1 font-bold" style={{ color: theme.primary }}>
                                            بدلاً من {Number(item.price) % 1 === 0
                                              ? Number(item.price).toFixed(0)
                                              : Number(item.price).toFixed(2)} جـ
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-2xl font-black">
                                          {Number(item.price) % 1 === 0
                                            ? Number(item.price).toFixed(0)
                                            : Number(item.price).toFixed(2)} جـ
                                        </div>
                                      )}
                                    </div>

                                    {/* Item Image - clickable */}
                                    {item.imageUrl && (
                                      <div className="mt-2 w-full h-32">
                                        <img
                                          src={item.imageUrl}
                                          alt={item.name}
                                          onClick={() => setSelectedImage(item.imageUrl!)}
                                          className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Decorative element */}
                                <div
                                  className="h-1 w-0 group-hover:w-full transition-all duration-500 mt-3 rounded-full mx-auto"
                                  style={{ backgroundColor: theme.primary }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Contact Message */}
                        {admin.contactMessage && (
                          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl border-2 border-blue-100">
                            <div className="text-gray-800 text-center whitespace-pre-line leading-relaxed font-medium">
                              {renderContactMessage(admin.contactMessage)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <p className="text-gray-600 mb-4 font-medium">
              هل أنت صاحب عمل وتريد إنشاء قائمتك الخاصة؟
            </p>
            <a
              href="https://wa.me/201143113410"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-lg font-bold text-purple-600 hover:text-purple-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              تواصل معي
            </a>
          </div>
        </div>
      </div>

      {/* Image Popup */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="عرض الصورة"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fastPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
        .animate-fast-pulse {
          animation: fastPulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
