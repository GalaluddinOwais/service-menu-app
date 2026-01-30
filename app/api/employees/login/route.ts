import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeByUsername, getAdmin, checkPlanAndAutoDisable } from '@/lib/db';
import { createSessionToken, comparePassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 });
    }

    // البحث عن العامل باسم المستخدم
    const employee = await getEmployeeByUsername(username);

    if (!employee) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // التحقق من كلمة المرور باستخدام bcrypt
    const isPasswordValid = await comparePassword(password, employee.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // التحقق من أن خطة الأدمن سارية (basic فما فوق) لتسجيل دخول العمال
    const admin = await getAdmin(employee.adminId);
    if (admin) {
      const planActive = await checkPlanAndAutoDisable(admin, 'basic');
      if (!planActive) {
        return NextResponse.json({ error: 'اشتراك صاحب المتجر منتهي. لا يمكن تسجيل الدخول حالياً' }, { status: 403 });
      }
    }

    // إنشاء token للعامل
    const token = createSessionToken(employee.id, employee.username, 'employee');

    return NextResponse.json({
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        adminId: employee.adminId,
        isDelivery: employee.isDelivery,
        isWaiter: employee.isWaiter,
      },
    });
  } catch (error) {
    console.error('Error during employee login:', error);
    return NextResponse.json({ error: 'فشل تسجيل الدخول' }, { status: 500 });
  }
}
