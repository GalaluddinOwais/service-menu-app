import { NextRequest, NextResponse } from 'next/server';
import {
  getAdmin,
  getEmployee,
  checkPlanAndAutoDisable,
  getUserStats,
} from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

/** GET /api/admin/stats/user?userId=xxx — عدّادات إحصائيات المستخدم (باقة البزنس فقط) */
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
    let userType: 'admin' | 'employee';
    let allowed = false;

    if (isSelf) {
      if (payload.adminId && userId === payload.adminId) {
        userType = 'admin';
        const admin = await getAdmin(userId);
        allowed = !!(admin && (await checkPlanAndAutoDisable(admin, 'business')));
      } else if (payload.employeeId && userId === payload.employeeId) {
        userType = 'employee';
        const emp = await getEmployee(userId);
        if (!emp) return NextResponse.json({ error: 'موظف غير موجود' }, { status: 404 });
        const admin = await getAdmin(emp.adminId);
        allowed = !!(admin && (await checkPlanAndAutoDisable(admin, 'business')));
      } else {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }
    } else if (payload.adminId) {
      const emp = await getEmployee(userId);
      if (!emp || emp.adminId !== payload.adminId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }
      userType = 'employee';
      const admin = await getAdmin(emp.adminId);
      allowed = !!(admin && (await checkPlanAndAutoDisable(admin, 'business')));
    } else {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    if (!allowed) {
      return NextResponse.json({ error: 'غير مصرح أو الباقة لا تدعم إحصائيات الطلبات' }, { status: 403 });
    }

    const stats = await getUserStats(userId, userType);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الإحصائيات', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
