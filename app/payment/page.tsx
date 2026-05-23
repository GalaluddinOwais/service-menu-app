'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');
    const [showManualDetails, setShowManualDetails] = useState(false);
    const [userData, setUserData] = useState<{ name: string, username: string } | null>(null);
    const [cardLoading, setCardLoading] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch user data from localStorage
        const stored = localStorage.getItem('admin_data');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Check direct properties or nested admin object
                if (data.name && data.username) {
                    setUserData({ name: data.name, username: data.username });
                } else if (data.admin && data.admin.name && data.admin.username) {
                    setUserData({ name: data.admin.name, username: data.admin.username });
                }
            } catch (e) {
                console.error("Failed to parse admin data", e);
            }
        }

        // If no plan or plan is free, redirect to admin
        if (!plan || plan === 'free') {
            router.push('/admin');
        }
    }, [plan, router]);

    const getPlanInfo = (p: string | null) => {
        if (p === 'business') return { name: 'باقة الأعمال', price: '199' };
        if (p === 'pro') return { name: 'الباقة الاحترافية', price: '149' };
        if (p === 'basic') return { name: 'الباقة الاساسية', price: '99' };
        return { name: '', price: '0' };
    };

    const planInfo = getPlanInfo(plan);

    if (!plan || plan === 'free') {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4" dir="rtl">
            <div className="w-full max-w-lg">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">اشترك في {planInfo.name}</h1>
                        <p className="text-blue-100">اختر طريقة الدفع المناسبة لك</p>
                    </div>

                    {/* Payment Options */}
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-1 text-3xl font-bold text-gray-800">
                                <span className="text-blue-600">{planInfo.price}</span>
                                <span className="text-sm text-gray-500 mt-2">جنيه / شهرياً</span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            {/* E-Wallet Payment */}
                            <div
                                onClick={() => setShowManualDetails(!showManualDetails)}
                                className={`p-4 bg-gray-50 rounded-lg border-2 transition cursor-pointer group select-none ${showManualDetails ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition ${showManualDetails ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white'}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-right flex-1">
                                        <h4 className="font-bold text-gray-800">المحفظة الإلكترونية</h4>
                                        <p className="text-xs text-gray-500">اضغط لعرض تفاصيل التحويل</p>
                                    </div>
                                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${showManualDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {showManualDetails && (
                                    <div className="mt-4 pt-4 border-t border-green-200 text-right space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-700 mb-2">
                                                <span className="font-bold">1.</span> حول مبلغ <span className="font-bold text-green-600">{planInfo.price} جنيه</span> للرقم التالي:
                                            </p>
                                            <div className="bg-white p-3 rounded border border-green-200 flex justify-between items-center" dir="ltr">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText('01143113410');
                                                    }}
                                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded transition font-medium"
                                                >
                                                    Copy
                                                </button>
                                                <span className="font-mono font-bold text-xl text-gray-800">01143113410</span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold">2.</span> أرسل تفاصيل حسابك وسكرين شوت التحويل على{' '}
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    // Get freshest data
                                                    let currentName = userData?.name;
                                                    let currentUsername = userData?.username;

                                                    if (!currentName || !currentUsername) {
                                                        const stored = localStorage.getItem('admin_data');
                                                        if (stored) {
                                                            try {
                                                                const data = JSON.parse(stored);
                                                                if (data.name) currentName = data.name;
                                                                if (data.username) currentUsername = data.username;
                                                                if (data.admin) {
                                                                    if (data.admin.name) currentName = data.admin.name;
                                                                    if (data.admin.username) currentUsername = data.admin.username;
                                                                }
                                                            } catch (e) { }
                                                        }
                                                    }

                                                    const nameText = currentName || '[اكتب اسمك هنا]';
                                                    const usernameText = currentUsername || '[اكتب اسم المستخدم هنا]';

                                                    const message = `مرحباً، أريد الاشتراك في ${planInfo.name} وقمت بتحويل ${planInfo.price} جنيه.\n\nبيانات حسابي:\nالاسم: ${nameText}\nاسم المستخدم: ${usernameText}\n\nسوف أرسل سكرين شوت تحويل المبلغ الآن.`;

                                                    window.open(`https://wa.me/201143113410?text=${encodeURIComponent(message)}`, '_blank');
                                                }}
                                                className="text-green-600 hover:text-green-700 font-bold underline"
                                            >
                                                واتساب
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Card Payment (Visa / Accept) */}
                            <div
                                role="button"
                                onClick={async () => {
                                    const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
                                    if (!token) {
                                        setCardError('يجب تسجيل الدخول أولاً ثم العودة لصفحة الدفع.');
                                        return;
                                    }
                                    setCardError(null);
                                    setCardLoading(true);
                                    try {
                                        const res = await fetch('/api/payment/create-session', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                            body: JSON.stringify({ plan }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) {
                                            setCardError(data.error || 'فشل إنشاء جلسة الدفع');
                                            return;
                                        }
                                        if (data.paymentUrl) {
                                            window.location.href = data.paymentUrl;
                                            return;
                                        }
                                        setCardError('لم تُرجع البوابة رابط الدفع');
                                    } catch {
                                        setCardError('خطأ في الاتصال. حاول مرة أخرى.');
                                    } finally {
                                        setCardLoading(false);
                                    }
                                }}
                                className={`p-4 bg-gray-50 rounded-lg border-2 transition cursor-pointer group select-none ${cardLoading ? 'opacity-70 cursor-wait' : 'border-gray-200 hover:border-blue-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <div className="text-right flex-1">
                                        <h4 className="font-bold text-gray-800">الدفع بالبطاقة (Visa / Mastercard)</h4>
                                        <p className="text-xs text-gray-500">{cardLoading ? 'جاري التحويل...' : 'تفعيل فوري للاشتراك'}</p>
                                    </div>
                                </div>
                                {cardError && <p className="mt-2 text-sm text-red-600">{cardError}</p>}
                            </div>

                            {/* Direct Contact */}
                            <a
                                href={`https://wa.me/201143113410?text=${encodeURIComponent(`مرحباً، أرغب في الاشتراك في ${planInfo.name}. هل يمكنكم مساعدتي؟`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-blue-600 group-hover:text-white transition">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </div>
                                    <div className="text-right flex-1">
                                        <h4 className="font-bold text-gray-800">تواصل معنا مباشرة</h4>
                                        <p className="text-xs text-gray-500">للمساعدة في عملية الاشتراك</p>
                                    </div>
                                </div>
                            </a>
                        </div>

                        {/* Skip for now button - Only show if NOT in upgrade mode */}
                        {searchParams.get('mode') !== 'upgrade' && (
                            <button
                                onClick={() => router.push('/admin')}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition text-center"
                            >
                                التخطي الآن والاشتراك لاحقا                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PaymentContent />
        </Suspense>
    );
}
