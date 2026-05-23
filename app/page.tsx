import Link from "next/link";
import { getAdmins } from "@/lib/db";

// Force dynamic rendering on every request (no caching) — diagnostic
export const dynamic = 'force-dynamic';

interface Admin {
  id: string;
  username: string;
  logoUrl?: string;
}

async function getClients(): Promise<Admin[]> {
  try {
    const admins = await getAdmins();
    return admins.map((admin: any) => ({
      id: admin.id,
      username: admin.username,
      logoUrl: admin.logoUrl,
    }));
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  const clients = await getClients();

  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-50 via-cyan-50 to-cyan-50" dir="rtl">
      {/* Brand */}
      <div className="max-w-6xl mx-auto pt-8 flex justify-center lg:justify-start lg:px-8">
        <h1 className="m-0">
          <img src="/logo.png" alt="على النت" className="h-36 md:h-48 w-auto" />
        </h1>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row px-8 pb-8 pt-4 max-w-6xl mx-auto">
        <div className="lg:w-1/2 text-center lg:text-right">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-500 bg-clip-text text-transparent pt-2 pb-2 leading-tight">
            حوّل تجارتك إلى موقع على الإنترنت!
          </h2>

          <p className="text-xl text-gray-700 mb-2 leading-relaxed">
            احصل على موقع خاص يعرض منتجاتك على الإنترنت
          </p>
          <p className="text-lg text-gray-600 mb-2">
            يسهّل على الزبون مشاهدة المنتجات وعمل الطلبات
          </p>
          <p className="text-lg text-gray-600 mb-8">
            ويسهّل عليك تعديل المنتجات ومتابعة الطلبات
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
            <Link
              href="/pricing"
              className="group bg-gradient-to-r from-teal-400 via-cyan-500 to-cyan-500 hover:from-teal-500 hover:via-cyan-600 hover:to-cyan-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl flex items-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              ابدأ الآن مجاناً
            </Link>

            <Link
              href="/login"
              className="group bg-white hover:bg-gray-50 text-gray-800 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg border-2 border-gray-200 hover:border-cyan-400 flex items-center gap-3"
            >
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              تسجيل الدخول
            </Link>
          </div>
        </div>

        {/* Mockup placeholder for large screens */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
          {/* يمكن إضافة mockup هنا لاحقاً */}
        </div>
      </div>

      {/* Clients Section */}
      {clients.length > 0 && (
        <div className="max-w-6xl mx-auto px-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">عملاؤنا</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/menu/${client.username}`}
                className="w-24 h-24 bg-white rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center overflow-hidden border border-gray-100 transition-all transform hover:scale-105"
              >
                {client.logoUrl ? (
                  <img
                    src={client.logoUrl}
                    alt={client.username}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-gray-600 font-bold text-sm text-center px-1">
                    {client.username}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-8 pb-16">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">المميزات</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* عرض المنتجات */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">عرض المنتجات والخدمات</h3>
            </div>
            <p className="text-gray-600 text-sm">اعرض سلعك وعروضك بطريقة احترافية وجذابة للعملاء</p>
          </div>

          {/* طلب عبر واتساب */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">طلب عبر واتساب</h3>
            </div>
            <p className="text-gray-600 text-sm">يستطيع العملاء الطلب من خلال الواتساب عن طريق الموقع أيضاً</p>
          </div>

          {/* سمات متعددة */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">سمات متعددة</h3>
            </div>
            <p className="text-gray-600 text-sm">صمم شكل وألوان موقعك بكل سهولة بحيث تناسب تجارتك</p>
          </div>

          {/* متجاوب */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">متجاوب تماماً</h3>
            </div>
            <p className="text-gray-600 text-sm">يعمل بشكل مثالي على جميع الأجهزة والشاشات</p>
          </div>

          {/* سريع وسلس */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">سريع وسلس</h3>
            </div>
            <p className="text-gray-600 text-sm">تجربة استخدام سريعة وسلسة للزبائن وللإدارة</p>
          </div>

          {/* ديناميكي */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">مرن وقابل للتخصيص</h3>
            </div>
            <p className="text-gray-600 text-sm">يمكنك تفعيل أو تعطيل أي من المميزات حسب تجارتك</p>
          </div>

          {/* طلب من الموقع — basic+ */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">طلب من الموقع</h3>
            </div>
            <p className="text-gray-600 text-sm">يستطيع العملاء الطلب مباشرة من الموقع بكل سهولة</p>
          </div>

          {/* متابعة الطلبات — basic+ */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">متابعة الطلبات</h3>
            </div>
            <p className="text-gray-600 text-sm">تابع جميع طلباتك الواردة سواء كانت طلبات توصيل أو طاولات</p>
          </div>

          {/* إنشاء إعلانات — basic+ */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">إنشاء إعلانات</h3>
            </div>
            <p className="text-gray-600 text-sm">أنشئ إعلانات جذابة لمنتجاتك بضغطة زر</p>
          </div>

          {/* ملخص نشاط العملاء — basic+ */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">ملخص نشاط العملاء</h3>
            </div>
            <p className="text-gray-600 text-sm">اعرف أكثر عملائك تفاعلاً وعدد طلبات كل عميل</p>
          </div>

          {/* طلبات الطاولات — pro+ */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">طلبات الطاولات</h3>
            </div>
            <p className="text-gray-600 text-sm">يستطيع عملاء المطاعم مسح QR كود مخصص لطاولتهم والطلب</p>
          </div>

          {/* إدارة العاملين — pro+ */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">إدارة العاملين</h3>
            </div>
            <p className="text-gray-600 text-sm">عيّن عاملي توصيل أو ندلاء ليتابعوا الطلبات وينجزوها</p>
          </div>

          {/* إحصائيات الطلبات — pro+ */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">إحصائيات الطلبات</h3>
            </div>
            <p className="text-gray-600 text-sm">تتبّع عدد الطلبات والإيرادات وأداء الإنجاز بالتفصيل</p>
          </div>

          {/* تقارير وتحليلات متقدمة — business */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">تقارير وتحليلات متقدمة</h3>
            </div>
            <p className="text-gray-600 text-sm">إيرادات عبر الزمن، أكثر المنتجات طلباً، وتحليلات أعمق لقرارات أفضل</p>
          </div>

          {/* تقييم وأداء الفريق — business */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800">تقييم وأداء الفريق</h3>
            </div>
            <p className="text-gray-600 text-sm">قِس أداء كل موظف ونادل وقيّم فريق العمل لإدارة أفضل</p>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-wrap justify-center gap-8 text-gray-600">
            <Link href="/about" className="hover:text-cyan-600 transition">من نحن</Link>
            <Link href="/privacy" className="hover:text-cyan-600 transition">سياسة الخصوصية</Link>
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}
