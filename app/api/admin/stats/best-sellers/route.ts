import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, checkPlanAndAutoDisable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

/** GET /api/admin/stats/best-sellers — أكثر المنتجات طلباً (باقة البزنس فقط) */
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
      return NextResponse.json({ items: [] });
    }

    const stats = admin.itemSalesStats ?? {};
    const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
    const items = Object.entries(stats)
      .filter(([, v]) => v.quantity > 0 || v.revenue > 0)
      .map(([name, v]) => ({ name, quantity: v.quantity, revenue: v.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching best-sellers:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب أكثر المنتجات طلباً', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
