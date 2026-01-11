import { NextRequest, NextResponse } from 'next/server';
import { createEmployee, getEmployees } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

// إنشاء عامل جديد
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    // Only admins can create employees
    if (!payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح - العاملون لا يمكنهم إضافة عاملين' }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, password, isDelivery, isWaiter } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const employee = await createEmployee({
      adminId: payload.adminId,
      name,
      username,
      password,
      isDelivery: isDelivery || false,
      isWaiter: isWaiter || false,
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// الحصول على قائمة العاملين
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    // Only admins can view employees list
    if (!payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const employees = await getEmployees(payload.adminId);
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}
