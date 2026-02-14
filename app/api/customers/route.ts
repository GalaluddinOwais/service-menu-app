import { NextRequest, NextResponse } from 'next/server';
import { getCustomers, getAdmin, checkPlanAndAutoDisable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

/** GET /api/customers — قائمة العملاء (paginated + search بالاسم/الرقم/العنوان) — Basic+ للأدمن */
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

    const planActive = await checkPlanAndAutoDisable(admin, 'basic');
    if (!planActive) {
      return NextResponse.json({ error: 'الباقة Basic فأعلى مطلوبة لتبويب نشاط العملاء' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search') ?? '';

    const { customers, total } = await getCustomers(adminId, { page, limit, search: search || undefined });

    const list = customers.map(c => ({
      adminId: c.adminId,
      phone: c.phone,
      name: c.name,
      orderCount: c.orderCount,
      address: c.address
    }));

    return NextResponse.json({
      customers: list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'فشل جلب العملاء' }, { status: 500 });
  }
}
