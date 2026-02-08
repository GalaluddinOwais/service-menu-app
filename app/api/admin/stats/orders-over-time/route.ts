import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, checkPlanAndAutoDisable, getOrdersOverTimeForAdmin } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

/** GET /api/admin/stats/orders-over-time — الطلبات المكتملة والإيراد عبر الزمن (باقة Business فقط، من الكاش مع إلحاق عند انتهاء الصلاحية) */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifySessionToken(authHeader.slice(7));
    if (!payload || !payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const adminId = payload.adminId;
    const admin = await getAdmin(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'الأدمن غير موجود' }, { status: 404 });
    }

    const planActive = await checkPlanAndAutoDisable(admin, 'business');
    if (!planActive) {
      return NextResponse.json({ error: 'هذه الإحصائيات متاحة ضمن باقة Business فقط' }, { status: 403 });
    }

    const cache = await getOrdersOverTimeForAdmin(adminId);
    if (!cache) {
      return NextResponse.json({
        cachedAt: new Date(0).toISOString(),
        delivery: {},
        table: {},
      });
    }

    return NextResponse.json(cache);
  } catch (error) {
    console.error('Error fetching orders over time:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الطلبات عبر الزمن', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
