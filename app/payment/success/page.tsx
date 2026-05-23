'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (!search || !search.includes('hmac=')) {
      setVerified(false);
      return;
    }
    fetch('/api/payment/verify-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search }),
    })
      .then((r) => r.json())
      .then((data) => setVerified(data.ok === true))
      .catch(() => setVerified(false));
  }, []);

  useEffect(() => {
    if (verified === null) return;
    const t = setTimeout(() => {
      window.location.href = '/admin';
    }, 5000);
    return () => clearTimeout(t);
  }, [verified]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">تم الدفع بنجاح</h1>
        <p className="text-gray-600 mb-6">تم تفعيل اشتراكك. سيتم توجيهك إلى لوحة التحكم خلال ثوانٍ.</p>
        <Link href="/admin" className="text-blue-600 font-bold hover:underline">
          الذهاب إلى لوحة التحكم الآن
        </Link>
      </div>
    </div>
  );
}
