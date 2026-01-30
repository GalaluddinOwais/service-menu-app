'use client';
import React from 'react';

interface LimitReachedModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export default function LimitReachedModal({ isOpen, onClose, title, message }: LimitReachedModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300" dir="rtl" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in scale-in-95 duration-300 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Blue/Indigo Gradient - Matching UpgradeModal Vibe */}
                <div
                    className="bg-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center relative"
                    style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)' }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-inner">
                        {/* أيقونة علامة تعجب نظيفة واحترافية */}
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold mb-1">{title}</h3>
                </div>

                {/* Content Area */}
                <div className="p-8 bg-white">
                    <p className="text-gray-600 text-center leading-relaxed text-lg mb-8">
                        {message}
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={onClose}
                            className="w-full bg-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-100 hover:brightness-110"
                            style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)' }}
                        >
                            حسناً، فهمت
                        </button>

                        <button
                            onClick={() => window.open('https://wa.me/201143113410', '_blank')}
                            className="w-full bg-white text-gray-800 font-bold py-5 rounded-2xl transition-all hover:bg-gray-50 flex items-center justify-center gap-4 border-2 border-gray-100 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.553 4.197 1.603 6.034L0 24l6.135-1.61c1.785.973 3.805 1.487 5.86 1.488h.005c6.634 0 12.05-5.414 12.05-12.05a11.83 11.83 0 00-3.533-8.514" />
                            </svg>
                            تواصل مع الدعم الفني
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
