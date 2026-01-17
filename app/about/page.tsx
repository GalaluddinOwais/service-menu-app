import Link from "next/link";

export default function AboutPage() {
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
        <h1 className="text-4xl font-bold mb-8 text-gray-800">من نحن</h1>

        <div className="bg-white rounded-2xl shadow-md p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-gray-800">أنا جلال الدين عويس، مهندس برمجيات</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              تخرجت من{" "}
              <a
                href="http://safcai.helwan.edu.eg/index.php/ar/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-700"
              >
                كلية الحاسبات والمعلومات بجامعة حلوان
              </a>{" "}
              عام 2023
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
حصلت على شهادة تطوير الويب الشامل من معهد تكنولوجيا المعلومات 
<a
                href="https://iti.gov.eg/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-700"
              > ITI </a>


 في مصر.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              أعمل حاليًا كمطور مواقع لدى شركة{" "}
              <a
                href="https://www.lgaassistance.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-700"
              >
                LGA Assistance
              </a>
            </p>
          </section>

          {/* Experience */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-gray-800">تشمل خبرتي العمل على مشاريع متنوعة مثل:</h2>
            <ul className="text-gray-600 space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>منصات لإدارة الطلبات والمنتجات</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>منصات إدارة الموارد البشرية والتوظيف تساعد الشركات على تنظيم فرق العمل ومتابعة الأداء</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>منصات تقدم خدمات علاجية ورحلات سفر</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>منصات لجمع التبرعات والتفاعل مع المستخدمين</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>منصات لتحليل البيانات واتخاذ القرار باستخدام الذكاء الاصطناعي والتعلم الآلي</span>
              </li>
            </ul>
          </section>

          {/* Goal */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-gray-800">هدفي من هذه المنصة</h2>
            <p className="text-gray-600 leading-relaxed">
              تمكين البائعين من عرض منتجاتهم وخدماتهم بشكل يظهر للزبون مدى احترافية وجدية البائع، علاوة على استقبال طلبات الزبائن وإنجازها بشكل منظم ومريح للبائع وطاقم العمل، مع مرونة وقابلية تخصيص حسب نوع التجارة.
            </p>
          </section>

          {/* Contact Info */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-gray-800">تواصل معي</h2>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Giza, Egypt</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-cyan-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <a
                  href="https://wa.me/201143113410"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-600 transition"
                  dir="ltr"
                >
                  +20 114 311 3410
                </a>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:galaluddinowais@gmail.com" className="hover:text-cyan-600 transition">galaluddinowais@gmail.com</a>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">تابعني</h2>
            <div className="flex gap-4">
              <a
                href="https://github.com/GalaluddinOwais"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/GalaluddinOwais"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex flex-wrap justify-center gap-8 text-gray-600">
            <Link href="/" className="hover:text-cyan-600 transition">الرئيسية</Link>
            <Link href="/privacy" className="hover:text-cyan-600 transition">سياسة الخصوصية</Link>
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}
