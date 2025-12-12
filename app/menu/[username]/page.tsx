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
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchMenuData();
  }, [username]);

  // Auto-scroll animation when section comes into view
  useEffect(() => {
    if (!scrollContainerRef || lists.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate scroll: move right then back
            setTimeout(() => {
              scrollContainerRef.scrollBy({ left: 150, behavior: 'smooth' });
              setTimeout(() => {
                scrollContainerRef.scrollBy({ left: -150, behavior: 'smooth' });
              }, 800);
            }, 300);
            // Disconnect after first trigger
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(scrollContainerRef);

    return () => observer.disconnect();
  }, [scrollContainerRef, lists]);

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
          ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${admin.backgroundUrl}) center/cover`
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
            <div className="mb-6">
              <img
                src={admin.logoUrl}
                alt="Logo"
                className="h-24 w-24 object-contain mx-auto rounded-full shadow-2xl ring-4 ring-white"
              />
            </div>
          )}
          <div className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
            <h1 className="text-5xl md:text-6xl font-black mb-3 drop-shadow-lg">
              قائمة {username}
            </h1>
          </div>


          {/* Welcome Message */}
          {admin.welcomeMessage && (
            <div className="mt-8 bg-white/95 backdrop-blur-md p-7 rounded-2xl shadow-2xl max-w-3xl mx-auto" >
              <div className="text-gray-900 text-2xl whitespace-pre-line leading-relaxed font-semibold" >
                {admin.welcomeMessage}
              </div>
            </div>
          )}



                    <p className="text-gray-700 text-2xl font-medium  p-5 mt-6">
            استكشف قوائمنا المميزة
          </p>

          {/* Theme indicator */}

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
            <div className="mb-8 relative">
              {/* Scroll Indicator - Left */}
              <div
                className="absolute left-0 top-0 bottom-4 w-12 pointer-events-none z-10 flex items-center justify-start pl-2"
                style={{
                  background: `linear-gradient(to right, ${theme.primary}80, transparent)`
                }}
              >
                <svg className="w-6 h-6 text-white/70 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>

              {/* Scroll Indicator - Right */}
              <div
                className="absolute right-0 top-0 bottom-4 w-12 pointer-events-none z-10 flex items-center justify-end pr-2"
                style={{
                  background: `linear-gradient(to left, ${theme.primary}80, transparent)`
                }}
              >
                <svg className="w-6 h-6 text-white/70 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <div
                ref={setScrollContainerRef}
                className="overflow-x-auto pb-4 scrollbar-hide"
              >
                <div className="flex gap-3 min-w-max justify-center px-12">
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
            </div>

            {/* Menu Lists */}
            <div className="grid gap-8">
              {lists
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
                          {listItems.map((item, itemIdx) => (
                            <div
                              key={item.id}
                              className="group bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 cursor-pointer"
                              style={{
                                animation: `slideUp 0.5s ease-out ${itemIdx * 50}ms`
                              }}
                            >
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
                                <div
                                  className="text-right flex-shrink-0"
                                  style={{ color: theme.accent }}
                                >
                                  <div className="text-2xl font-black">
                                 {Number(item.price).toFixed(2)} جـ  
                                  </div>
                                </div>
                              </div>

                              {/* Decorative element */}
                              <div
                                className="h-1 w-0 group-hover:w-full transition-all duration-500 mt-3 rounded-full mx-auto"
                                style={{ backgroundColor: theme.primary }}
                              ></div>
                            </div>
                          ))}
                        </div>

                        {/* Contact Message */}
                        {admin.contactMessage && (
                          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl border-2 border-blue-100">
                            <div className="text-gray-800 text-center whitespace-pre-line leading-relaxed font-medium">
                              {admin.contactMessage}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <p className="text-gray-600 mb-4 font-medium">
              هل أنت صاحب عمل؟ هل تريد إنشاء قائمتك الخاصة؟
            </p>
            <Link
              href="/login"
              className={`inline-block bg-gradient-to-r ${theme.gradient} hover:shadow-2xl text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105`}
            >
              ابدأ الآن
            </Link>
          </div>
        </div>
      </div>

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
