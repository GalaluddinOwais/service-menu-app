import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-50 via-cyan-50 to-cyan-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700 transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            العودة للرئيسية
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">سياسة الخصوصية</h1>

        <div className="bg-white rounded-2xl shadow-md p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">مقدمة</h2>
            <p className="text-gray-600 leading-relaxed">
              نحن نقدر خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات التي تقدمها عند استخدام خدماتنا.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">البيانات التي نجمعها</h2>
            <div className="text-gray-600 space-y-4">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">معلومات الحساب:</h3>
                <p>نقوم بمنح اسم مستخدم وكلمة سر لأول مرة، ويمكن تغييرها لاحقاً. يتم تسجيل كلمات المرور بشكل مشفر لضمان الأمان.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">معلومات النشاط التجاري (تظهر للعامة):</h3>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>اسم المتجر</li>
                  <li>الشعار</li>
                  <li>معلومات التواصل</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">بيانات المنتجات (تظهر للعامة):</h3>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>أسماء المنتجات</li>
                  <li>الأسعار</li>
                  <li>الصور</li>
                  <li>الأوصاف</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">بيانات الطلبات (خاصة):</h3>
                <p>تفاصيل الطلبات ومعلومات العملاء للتوصيل. هذه البيانات تظهر ويتحكم بها البائع والعمال المحددين فقط إذا أراد البائع ذلك.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">كيف نستخدم بياناتك</h2>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>تقديم خدماتنا وتشغيل موقعك الإلكتروني</li>
              <li>معالجة الطلبات والتواصل مع العملاء</li>
              <li>تحسين خدماتنا وتجربة المستخدم</li>
              <li>إرسال إشعارات مهمة حول حسابك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">حماية البيانات والمشاركة مع أطراف ثالثة</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              <p>
                نستخدم تقنيات أمان متقدمة لحماية بياناتك، بما في ذلك التشفير والاتصالات الآمنة (HTTPS).
              </p>
              <p>
                <span className="font-bold text-gray-800">لا نشارك بياناتك مع أي طرف ثالث</span> فيما عدا واتساب عند استخدام ميزة الطلب عبر واتساب، حيث يتم إرسال بيانات الطلب فقط (وليس بيانات البائع) إلى واتساب لإتمام عملية التواصل.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">حقوقك</h2>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>الوصول إلى بياناتك الشخصية</li>
              <li>تصحيح أو تحديث بياناتك</li>
              <li>طلب حذف حسابك وبياناتك</li>
              <li>الاعتراض على معالجة بياناتك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">ملفات تعريف الارتباط (Cookies)</h2>
            <p className="text-gray-600 leading-relaxed">
              نحن <span className="font-bold text-gray-800">لا نجمع ملفات تعريف الارتباط (Cookies)</span> من خلال منصتنا.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">تحديثات السياسة</h2>
            <p className="text-gray-600 leading-relaxed">
              قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة مع تاريخ التحديث.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">تواصل معنا</h2>
            <p className="text-gray-600 leading-relaxed">
              إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا.
            </p>
          </section>

          <p className="text-gray-500 text-sm pt-4 border-t">
            آخر تحديث: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex flex-wrap justify-center gap-8 text-gray-600">
            <Link href="/" className="hover:text-cyan-600 transition">الرئيسية</Link>
            <Link href="/about" className="hover:text-cyan-600 transition">من نحن</Link>
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}
