'use client';
import Link from 'next/link';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName: string;
    requiredPlan: 'basic' | 'pro' | 'business';
    /** true when user had a paid plan but subscription ended (show "renew" copy); false when plan is free (show "upgrade" copy) */
    isExpired?: boolean;
}

export default function UpgradeModal({ isOpen, onClose, featureName, requiredPlan, isExpired = false }: UpgradeModalProps) {
    if (!isOpen) return null;

    const getPlanInfo = (plan: 'basic' | 'pro' | 'business'): { name: string; price: string } => {
        switch (plan) {
            case 'basic':
                return { name: 'الباقة الاساسية', price: '99' };
            case 'pro':
                return { name: 'الباقة الاحترافية', price: '149' };
            case 'business':
                return { name: 'باقة الأعمال', price: '199' };
        }
    };

    // Get all available plans for this feature (current required plan and higher)
    const getAvailablePlans = () => {
        const allPlans: ('basic' | 'pro' | 'business')[] = ['basic', 'pro', 'business'];
        const requiredIndex = allPlans.indexOf(requiredPlan);
        return allPlans.slice(requiredIndex);
    };

    const availablePlans = getAvailablePlans();

    const headerTitle = isExpired ? 'انتهى اشتراكك' : 'ميزة مقفلة';
    const headerSubtitle = isExpired
        ? <>اشتراكك انتهى. جدد اشتراكك لاستخدام <span className="font-bold">{featureName}</span> وغيرها من الميزات.</>
        : <>ميزة <span className="font-bold">{featureName}</span> متاحة في الباقات التالية</>;

    const headerGradient = isExpired
        ? 'linear-gradient(to right, #d97706, #ea580c)'   /* amber-600 to orange-600 */
        : 'linear-gradient(to right, #2563eb, #4f46e5)';  /* blue-600 to indigo-600 */

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Gradient */}
                <div className="p-6 text-white text-center relative" style={{ background: headerGradient }}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        {isExpired ? (
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        )}
                    </div>

                    <h3 className="text-2xl font-bold mb-1 text-white">{headerTitle}</h3>
                    <p className="text-sm" style={{ color: isExpired ? 'rgba(255,251,235,0.95)' : 'rgba(224,242,254,0.95)' }}>
                        {headerSubtitle}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Available Plans */}
                    <div className="space-y-3 mb-6">
                        {availablePlans.map((plan) => {
                            const planInfo = getPlanInfo(plan);

                            return (
                                <div
                                    key={plan}
                                    className="border border-gray-100 bg-gray-50 rounded-lg p-4 transition hover:bg-gray-100"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h5 className="font-bold text-gray-800">{planInfo.name}</h5>
                                            <p className="text-sm text-gray-600">{planInfo.price} جنيه / شهرياً</p>
                                        </div>
                                        <Link
                                            href={`/payment?plan=${plan}&mode=upgrade`}
                                            onClick={onClose}
                                            className="inline-block text-white px-8 py-2 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95 hover:shadow-lg hover:brightness-110"
                                            style={{ background: headerGradient }}
                                        >
                                            {isExpired ? 'جدد الاشتراك' : 'اشترك الآن'}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Explore All Plans / Renew */}
                    <Link
                        href="/pricing?mode=upgrade"
                        onClick={onClose}
                        className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition text-center"
                    >
                        {isExpired ? 'عرض الباقات وتجديد الاشتراك' : 'استكشف جميع الباقات'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
