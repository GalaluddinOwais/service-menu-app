import { NextRequest, NextResponse } from 'next/server';
import {
  getAdmin,
  getEmployee,
  checkPlanAndAutoDisable,
  getDeliveryOrderStatusLogsByUser,
} from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

/** GET /api/admin/stats/delivery-logs?userId=xxx — سجلات تغيير حالة طلبات التوصيل (باقة البزنس فقط) */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifySessionToken(authHeader.slice(7));
    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get('userId') ?? (payload.adminId ?? payload.employeeId ?? null);
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const isSelf = userId === payload.adminId || userId === payload.employeeId;
    let adminId: string | undefined;
    let allowed = false;

    if (isSelf) {
      if (payload.adminId) {
        adminId = payload.adminId;
        const admin = await getAdmin(adminId);
        allowed = !!(admin && (await checkPlanAndAutoDisable(admin, 'business')));
      } else if (payload.employeeId) {
        const emp = await getEmployee(payload.employeeId);
        if (!emp) return NextResponse.json({ error: 'موظف غير موجود' }, { status: 404 });
        adminId = emp.adminId;
        const admin = await getAdmin(adminId);
        allowed = !!(admin && (await checkPlanAndAutoDisable(admin, 'business')));
      }
    } else if (payload.adminId) {
      const emp = await getEmployee(userId);
      if (!emp || emp.adminId !== payload.adminId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }
      adminId = emp.adminId;
      const admin = await getAdmin(adminId);
      allowed = !!(admin && (await checkPlanAndAutoDisable(admin, 'business')));
    }

    if (!allowed || adminId == null) {
      return NextResponse.json({ error: 'غير مصرح أو الباقة لا تدعم إحصائيات الطلبات' }, { status: 403 });
    }

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20')));
    const allLogs = await getDeliveryOrderStatusLogsByUser(adminId, userId);
    const total = allLogs.length;
    const logs = allLogs.slice((page - 1) * limit, page * limit);
    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    console.error('Error fetching delivery logs:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب السجلات', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
