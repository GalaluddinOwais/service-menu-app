import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeByUsername } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

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

    // التحقق من كلمة المرور
    if (employee.password !== password) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
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
