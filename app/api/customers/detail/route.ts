import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByPhone, getAdmin, checkPlanAndAutoDisable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

/** GET /api/customers/detail?adminId=...&phone=... — تفاصيل عميل واحد — Basic+ */
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
      return NextResponse.json({ error: 'الباقة Basic فأعلى مطلوبة' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone') ?? '';
    if (!phone.trim()) {
      return NextResponse.json({ error: 'معرف العميل (phone) مطلوب' }, { status: 400 });
    }

    const customer = await getCustomerByPhone(adminId, phone);
    if (!customer) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    return NextResponse.json({ error: 'فشل جلب تفاصيل العميل' }, { status: 500 });
  }
}
