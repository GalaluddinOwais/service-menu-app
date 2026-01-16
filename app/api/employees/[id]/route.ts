import { NextRequest, NextResponse } from 'next/server';
import { deleteEmployee, getEmployee, updateEmployee } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifySessionToken(token);
    if (!payload || !payload.adminId) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    const { id } = await context.params;

    // التحقق من أن العامل ينتمي للأدمن
    const employee = await getEmployee(id);
    if (!employee) {
      return NextResponse.json({ error: 'العامل غير موجود' }, { status: 404 });
    }

    if (employee.adminId !== payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();

    // تجهيز التحديثات
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updates.name = body.name;
    }
    if (body.isDelivery !== undefined) {
      updates.isDelivery = body.isDelivery;
    }
    if (body.isWaiter !== undefined) {
      updates.isWaiter = body.isWaiter;
    }
    if (body.password !== undefined && body.password.trim() !== '') {
      updates.password = body.password;
    }

    const updatedEmployee = await updateEmployee(id, updates);
    if (!updatedEmployee) {
      return NextResponse.json({ error: 'فشل تحديث العامل' }, { status: 500 });
    }

    // لا نرسل كلمة المرور في الرد
    const { password: _, ...safeEmployee } = updatedEmployee;
    return NextResponse.json({ success: true, employee: safeEmployee });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    // التحقق من أن العامل ينتمي للأدمن
    const employee = await getEmployee(id);
    if (!employee) {
      return NextResponse.json({ error: 'العامل غير موجود' }, { status: 404 });
    }

    if (employee.adminId !== payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const deleted = await deleteEmployee(id);
    if (!deleted) {
      return NextResponse.json({ error: 'فشل حذف العامل' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
