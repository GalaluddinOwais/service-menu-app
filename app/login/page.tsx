'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'admin' | 'employee'>('admin');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // استخدام endpoint مختلف حسب نوع المستخدم
      const endpoint = userType === 'admin' ? '/api/auth' : '/api/employees/login';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول');
        setIsLoading(false);
        return;
      }

      if (userType === 'admin') {
        // حفظ بيانات الأدمن + session token في localStorage
        localStorage.setItem('admin_data', JSON.stringify(data));

        // حفظ الـ session token بشكل منفصل للوصول السريع
        if (data.sessionToken) {
          localStorage.setItem('session_token', data.sessionToken);
        }

        // If there's a plan parameter and it's a paid plan, redirect to payment
        if (plan && plan !== 'free') {
          router.push(`/payment?plan=${plan}`);
        } else {
          router.push('/admin');
        }
      } else {
        // حفظ بيانات العامل + token في localStorage
        localStorage.setItem('employee_data', JSON.stringify({
          ...data.employee,
          token: data.token,
          userType: 'employee'
        }));
        localStorage.setItem('session_token', data.token);

        // Employees always go to admin (no payment page)
        router.push('/admin');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
      setIsLoading(false);
    }
  };

  const getPlanName = (p: string | null) => {
    if (p === 'business') return 'المؤسسات';
    if (p === 'pro') return 'المطاعم';
    if (p === 'basic') return 'الأساسي';
    return '';
  };

  const planName = getPlanName(plan);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
            <div className="mb-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">تسجيل الدخول</h1>
            <p className="text-blue-100">للتحكم بقائمة خدماتك</p>
            {planName && (
              <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg py-2 px-4 inline-block">
                <span className="text-sm font-medium">✨ باقة {planName}</span>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
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

              {/* User Type Selector */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUserType('admin')}
                  className={`flex-1 py-2 px-4 rounded-md font-bold transition ${userType === 'admin'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  صاحب العمل
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('employee')}
                  className={`flex-1 py-2 px-4 rounded-md font-bold transition ${userType === 'employee'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  موظف
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم المستخدم
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
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="أدخل اسم المستخدم"
                  />
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
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-2">
                ليس لديك حساب؟
              </p>
              <Link
                href={plan ? `/register?plan=${plan}` : '/register'}
                className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
              >
                إنشاء حساب جديد
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
