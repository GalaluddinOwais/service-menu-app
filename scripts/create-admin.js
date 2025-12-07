// سكريبت لإنشاء أدمن جديد
// الاستخدام: node scripts/create-admin.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const THEMES = ['ocean', 'sunset', 'forest', 'royal', 'rose'];

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('=== إنشاء حساب أدمن جديد ===\n');

  const username = await question('اسم المستخدم: ');
  const password = await question('كلمة المرور: ');

  console.log('\nالسمات المتاحة:');
  THEMES.forEach((theme, index) => {
    console.log(`${index + 1}. ${theme}`);
  });

  const themeIndex = await question('\nاختر رقم السمة (1-5): ');
  const theme = THEMES[parseInt(themeIndex) - 1] || 'ocean';

  const logoUrl = await question('رابط الشعار (اختياري، اضغط Enter للتخطي): ');
  const backgroundUrl = await question('رابط الخلفية (اختياري، اضغط Enter للتخطي): ');

  const dataPath = path.join(process.cwd(), 'data', 'menu.json');

  // تأكد من وجود مجلد data
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // قراءة البيانات الحالية أو إنشاء ملف جديد
  let data = { admins: [], lists: [], items: [] };
  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }

  // التحقق من عدم تكرار username
  if (data.admins.find(a => a.username === username)) {
    console.log('\n❌ خطأ: اسم المستخدم موجود بالفعل!');
    rl.close();
    return;
  }

  // إنشاء الأدمن الجديد
  const newAdmin = {
    id: Date.now().toString(),
    username,
    password,
    theme,
    logoUrl: logoUrl || undefined,
    backgroundUrl: backgroundUrl || undefined
  };

  data.admins.push(newAdmin);

  // حفظ البيانات
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  console.log('\n✅ تم إنشاء الحساب بنجاح!');
  console.log(`\n📋 معلومات الحساب:`);
  console.log(`   اسم المستخدم: ${username}`);
  console.log(`   السمة: ${theme}`);
  console.log(`\n🔗 رابط قائمتك: http://localhost:3000/menu/${username}`);
  console.log(`🔐 لوحة التحكم: http://localhost:3000/login`);

  rl.close();
}

createAdmin().catch(err => {
  console.error('حدث خطأ:', err);
  rl.close();
});
