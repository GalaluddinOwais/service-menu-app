import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "تطبيق القوائم الذكية - إنشاء قوائم طعام احترافية",
  description: "أنشئ قائمة طعام احترافية وجذابة لمطعمك أو مقهاك مع تصميمات مذهلة وسمات متعددة. نظام إدارة قوائم متعدد المستخدمين مع دعم التخصيص الكامل.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
