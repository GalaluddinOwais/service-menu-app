'use client';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">تم إلغاء الدفع</h1>
        <p className="text-gray-600 mb-6">لم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى أو اختيار طريقة دفع أخرى.</p>
        <Link href="/admin" className="inline-block bg-gray-800 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-700 transition">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
