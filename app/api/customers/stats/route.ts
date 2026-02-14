import { NextRequest, NextResponse } from 'next/server';
import { getOrComputeCustomerBusinessStats, getAdmin, checkPlanAndAutoDisable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

/** GET /api/customers/stats?adminId=...&phone=... — إحصائيات عميل (طلبات، عناصر، آخر طلب، إجمالي مدفوع/موفر) — Business فقط، مع كاش */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifySessionToken(authHeader.slice(7));
    if (!payload?.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const adminId = payload.adminId;
    const admin = await getAdmin(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'الأدمن غير موجود' }, { status: 404 });
    }

    const planActive = await checkPlanAndAutoDisable(admin, 'business');
    if (!planActive) {
      return NextResponse.json({ error: 'الباقة Business مطلوبة لإحصائيات العملاء المتقدمة' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone') ?? '';
    if (!phone.trim()) {
      return NextResponse.json({ error: 'معرف العميل (phone) مطلوب' }, { status: 400 });
    }

    const { data, fromCache } = await getOrComputeCustomerBusinessStats(adminId, phone);

    return NextResponse.json({
      ...data,
      fromCache
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json({ error: 'فشل جلب إحصائيات العميل' }, { status: 500 });
  }
}
