# دليل الإعداد السريع

## الخطوة 1: تثبيت التطبيق
```bash
npm install
```

## الخطوة 2: تشغيل التطبيق
```bash
npm run dev
```

## الخطوة 3: إنشاء أول حساب أدمن

### الطريقة 1: استخدام API مباشرة
افتح terminal جديد واستخدم أحد الأوامر التالية:

#### باستخدام curl:
```bash
curl -X POST http://localhost:3000/api/admins \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\",\"theme\":\"ocean\"}"
```

#### باستخدام PowerShell (Windows):
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/admins" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"admin123","theme":"ocean"}'
```

### الطريقة 2: استخدام أداة API (مثل Postman أو Insomnia)
- URL: `http://localhost:3000/api/admins`
- Method: POST
- Body (JSON):
```json
{
  "username": "admin",
  "password": "admin123",
  "theme": "ocean"
}
```

### الطريقة 3: استخدام متصفح Developer Tools
1. افتح المتصفح واذهب إلى `http://localhost:3000`
2. افتح Console (F12)
3. نفذ هذا الكود:
```javascript
fetch('http://localhost:3000/api/admins', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123',
    theme: 'ocean'
  })
})
.then(r => r.json())
.then(d => console.log('Admin created:', d))
```

## الخطوة 4: تسجيل الدخول
1. اذهب إلى `http://localhost:3000/login`
2. أدخل:
   - اسم المستخدم: `admin`
   - كلمة المرور: `admin123`
3. اضغط "تسجيل الدخول"

## الخطوة 5: البدء باستخدام التطبيق
1. من لوحة التحكم، أضف قائمة جديدة
2. أضف عناصر للقائمة
3. اذهب إلى "إعدادات الحساب" لتخصيص السمة والشعار
4. شارك رابط قائمتك: `http://localhost:3000/menu/admin`

## إنشاء مستخدمين إضافيين
يمكنك إنشاء مستخدمين إضافيين بنفس الطريقة، فقط غيّر username:
```json
{
  "username": "restaurant1",
  "password": "password123",
  "theme": "sunset",
  "logoUrl": "https://example.com/logo.png",
  "backgroundUrl": "https://example.com/bg.jpg"
}
```

## السمات المتاحة
اختر أحد السمات التالية عند إنشاء الحساب:
- `ocean` - المحيط (أزرق فاتح)
- `sunset` - الغروب (برتقالي وأحمر)
- `forest` - الغابة (أخضر)
- `royal` - الملكي (بنفسجي)
- `rose` - الوردي (وردي)

## ملاحظات مهمة
- تأكد من أن التطبيق يعمل على `http://localhost:3000`
- ملف البيانات سيتم إنشاؤه تلقائياً في `data/menu.json`
- كل أدمن يرى قوائمه فقط
- يمكن تغيير السمة والإعدادات في أي وقت من لوحة التحكم

## حل المشاكل

### المشكلة: خطأ عند إنشاء admin
**الحل**: تأكد من أن التطبيق يعمل وأن username فريد (غير مستخدم من قبل)

### المشكلة: لا يمكن تسجيل الدخول
**الحل**: تأكد من صحة username و password

### المشكلة: لا تظهر البيانات
**الحل**: تحقق من ملف `data/menu.json` وتأكد من أنه يحتوي على البيانات

---
استمتع باستخدام تطبيق القوائم الذكية!
