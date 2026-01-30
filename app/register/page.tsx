'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function RegisterForm() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }

        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    username,
                    password,
                    plan: plan || 'free' // Pass the selected plan
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'فشل إنشاء الحساب');
                setIsLoading(false);
                return;
            }

            // حفظ بيانات الأدمن + session token في localStorage
            localStorage.setItem('admin_data', JSON.stringify(data));

            // حفظ الـ session token بشكل منفصل
            if (data.sessionToken) {
                localStorage.setItem('session_token', data.sessionToken);
            }

            // If paid plan, redirect to payment page
            if (plan && plan !== 'free') {
                router.push(`/payment?plan=${plan}`);
            } else {
                // Free plan, go directly to admin
                router.push('/admin');
            }
        } catch (err) {
            setError('حدث خطأ أثناء إنشاء الحساب');
            setIsLoading(false);
        }
    };

    const getPlanName = (p: string | null) => {
        if (p === 'business') return 'الأعمال';
        if (p === 'pro') return 'الاحترافي';
        if (p === 'basic') return 'الأساسي';
        return '';
    };

    const planName = getPlanName(plan);

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
                    <div className="mb-4">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">إنشاء حساب جديد</h1>
                    <p className="text-blue-100">ابدأ رحلتك معنا اليوم</p>
                    {planName && (
                        <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg py-2 px-4 inline-block">
                            <span className="text-sm font-medium">باقة {planName}</span>
                        </div>
                    )}
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-red-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-red-700 text-sm font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                الاسم الكامل
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="أدخل اسمك الكامل"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                اسم المستخدم
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="أدخل اسم المستخدم بالإنجليزية"
                                    pattern="[a-zA-Z0-9_\-]+"
                                    title="يرجى استخدام الأحرف الإنجليزية والأرقام فقط"
                                />
                                <p className="text-xs text-gray-500 mt-1 mr-1">يستخدم لتسجيل الدخول ورابط قائمتك</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="أدخل كلمة المرور"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                تأكيد كلمة المرور
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="أعد إدخال كلمة المرور"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-6"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري إنشاء الحساب...
                                </span>
                            ) : (
                                'تسجيل حساب جديد'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-gray-600 mb-2">
                            لديك حساب بالفعل؟
                        </p>
                        <Link
                            href={plan ? `/login?plan=${plan}` : '/login'}
                            className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
                        >
                            تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4" dir="rtl">
            <Suspense fallback={<div>Loading...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
