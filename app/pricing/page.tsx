'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PricingContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const isUpgradeMode = mode === 'upgrade';

  // Helper to get the correct link destination
  const getLink = (plan: string) => {
    return isUpgradeMode
      ? `/payment?plan=${plan}&mode=upgrade`
      : `/register?plan=${plan}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-50 via-cyan-50 to-cyan-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700 transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            العودة للرئيسية
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">خطط الاشتراك</h1>
        <p className="text-gray-600 text-center mb-12">اختر الخطة المناسبة لتجارتك</p>

        <div className={`grid md:grid-cols-2 gap-6 items-stretch ${isUpgradeMode ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
          {/* Free Plan - Hide in upgrade mode */}
          {!isUpgradeMode && (
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all flex flex-col">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">المجانية</h2>
                <div className="text-4xl font-bold text-cyan-600 mb-1">0</div>
                <p className="text-gray-500 text-sm">جنيه / شهرياً</p>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">عرض المنتجات حتى 15 منتج</span>
                </li>

                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">طلبات عبر واتساب</span>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">الطلب المباشر من الموقع</span>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">إدارة عاملين</span>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">طلبات الطاولات والندلاء</span>
                </li>
              </ul>

              <Link
                href="/register"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold transition text-sm"
              >
                ابدأ مجاناً
              </Link>
            </div>
          )}

          {/* Basic Plan */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all relative flex flex-col">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">الأساسية</h2>
              <div className="text-4xl font-bold text-cyan-600 mb-1">99</div>
              <p className="text-gray-500 text-sm">ج.م / شهرياً</p>
            </div>

            <ul className="space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">منتجات غير محدودة</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">تلقي الطلبات عبر الموقع</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm"> إدارة عمال التوصيل حتى 15 عامل  </span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">صانع إعلانات</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">ملخص نشاط العملاء</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm">طلبات الطاولات والندلاء</span>
              </li>
            </ul>

            <Link
              href={getLink('basic')}
              className="block w-full text-center bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-xl font-bold transition text-sm"
            >
              اشترك الآن            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-cyan-500 hover:shadow-xl transition-all relative scale-105 z-10 flex flex-col">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-cyan-500 text-white px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap">الأكثر طلباً</span>
            </div>

            <div className="text-center mb-6 mt-2">
              <h2 className="text-xl font-bold text-gray-800 mb-2">الاحترافية</h2>
              <div className="text-4xl font-bold text-cyan-600 mb-1">149</div>
              <p className="text-gray-500 text-sm">ج.م / شهرياً</p>
            </div>

            <ul className="space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-bold">كل مميزات الأساسية</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">طلبات الطاولات (QR)</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">إدارة الندلاء (الويترز)</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">حتى 25 عامل توصيل ونادل</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">إحصائيات الطلبات</span>
              </li>
            </ul>

            <Link
              href={getLink('pro')}
              className="block w-full text-center bg-gradient-to-r from-teal-400 via-cyan-500 to-cyan-500 hover:from-teal-500 hover:via-cyan-600 hover:to-cyan-600 text-white py-3 rounded-xl font-bold transition text-sm shadow-md shadow-cyan-100"
            >
              اشترك الآن            </Link>
          </div>

          {/* Business Plan */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all flex flex-col">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">باقة الأعمال</h2>
              <div className="text-4xl font-bold text-cyan-600 mb-1">199</div>
              <p className="text-gray-500 text-sm">ج.م / شهرياً</p>
            </div>

            <ul className="space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-bold">كل مميزات الاحترافية</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">حتى 50 عامل توصيل ونادل</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">تقارير وتحليلات متقدمة</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">تقييم وإدارة أداء الفريق</span>
              </li>
            </ul>

            <Link
              href={getLink('business')}
              className="block w-full text-center bg-cyan-600 text-white py-3 rounded-xl font-bold transition text-sm hover:bg-black"
            >
              اشترك الآن            </Link>
          </div>
        </div>

        {/* Contact Note */}
        <div className="mt-12 flex items-center justify-center gap-2 text-gray-600 text-lg flex-wrap">
          <span>للاستفسار تواصل معنا على</span>
          <a
            href="https://wa.me/201143113410"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>واتساب</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex flex-wrap justify-center gap-8 text-gray-600">
            <Link href="/" className="hover:text-cyan-600 transition">الرئيسية</Link>
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

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
