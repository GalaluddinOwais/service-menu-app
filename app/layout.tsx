import type { Metadata } from "next";
import "./globals.css";
import { balooBhaijaanFont } from '@/lib/fonts';

export const metadata: Metadata = {
  title: "على النت — تجارتك على الإنترنت",
  description: "على النت — نظام متكامل لإدارة المطاعم والمتاجر: قوائم احترافية، طلبات من الموقع وواتساب، طلبات الطاولات بـ QR، إدارة عمال التوصيل والندلاء، وتقارير وتحليلات متقدمة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`bg-gray-50 ${balooBhaijaanFont.className}`}>{children}</body>
    </html>
  );
}
