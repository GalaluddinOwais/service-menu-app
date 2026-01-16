import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, updateAdmin } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
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

    const admin = await getAdmin(payload.adminId);
    if (!admin) {
      return NextResponse.json({ error: 'الأدمن غير موجود' }, { status: 404 });
    }

    const body = await request.json();

    // Update only the fields that are provided
    const updatedAdmin = await updateAdmin(payload.adminId, {
      ...admin,
      ...(body.enableDeliveryEmployees !== undefined && { enableDeliveryEmployees: body.enableDeliveryEmployees }),
      ...(body.enableWaiters !== undefined && { enableWaiters: body.enableWaiters }),
      ...(body.showDeliveryEmployeesAnyway !== undefined && { showDeliveryEmployeesAnyway: body.showDeliveryEmployeesAnyway }),
      ...(body.showWaitersAnyway !== undefined && { showWaitersAnyway: body.showWaitersAnyway }),
      ...(body.defaultDeliveryAssignment !== undefined && { defaultDeliveryAssignment: body.defaultDeliveryAssignment }),
    });

    if (!updatedAdmin) {
      return NextResponse.json({ error: 'فشل تحديث الإعدادات' }, { status: 500 });
    }

    return NextResponse.json({ success: true, admin: updatedAdmin });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json({ error: 'خطأ في تحديث الإعدادات' }, { status: 500 });
  }
}
