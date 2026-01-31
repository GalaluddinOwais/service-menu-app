import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, checkPlanAndAutoDisable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

/** GET /api/admin/stats/orders — إحصائيات الطلبات (Basic+ للشريط الكامل، Pro+ للكامل) */
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

    const planActive = await checkPlanAndAutoDisable(admin, 'basic');
    if (!planActive) {
      return NextResponse.json({ error: 'الباقة لا تدعم إحصائيات الطلبات' }, { status: 403 });
    }

    const stats = admin.proOrderStats ?? {
      countWhatsapp: 0,
      countWebsite: 0,
      countTable: 0,
      sumPriceWhatsapp: 0,
      sumPriceWebsite: 0,
      sumPriceTable: 0,
      sumDiscountWhatsapp: 0,
      sumDiscountWebsite: 0,
      sumDiscountTable: 0,
      completedDeliveryWhatsapp: 0,
      completedDeliveryWebsite: 0,
      completedTable: 0,
      sumCompletedPriceWhatsapp: 0,
      sumCompletedPriceWebsite: 0,
      sumCompletedPriceTable: 0,
      sumCompletedDiscountWhatsapp: 0,
      sumCompletedDiscountWebsite: 0,
      sumCompletedDiscountTable: 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب إحصائيات الطلبات', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
