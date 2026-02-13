import { NextRequest, NextResponse } from 'next/server';
import { createEmployee, getEmployees, getAdmin } from '@/lib/db';
import { verifySessionToken, hashPassword } from '@/lib/auth';

// إنشاء عامل جديد
export async function POST(request: NextRequest) {
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

    // Only admins can create employees
    if (!payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح - العاملون لا يمكنهم إضافة عاملين' }, { status: 403 });
    }

    const body = await request.json();
    const { name, username, password, isDelivery, isWaiter, imageUrl, phone, color } = body;

    // Fetch admin info to check plan
    const admin = await getAdmin(payload.adminId);

    if (!admin) {
      return NextResponse.json({ error: 'الأدمن غير موجود' }, { status: 404 });
    }

    // Check if subscription is valid
    const isPlanActive = () => {
      if (!admin.plan || admin.plan === 'free') return false;
      if (!admin.subscriptionEndsAt) return false;
      const expiryDate = new Date(admin.subscriptionEndsAt);
      return expiryDate >= new Date();
    };

    if (!isPlanActive()) {
      return NextResponse.json({
      }, { status: 403 });
    }

    // Check employee count based on plan
    if (admin.plan === 'basic') {
      const { total } = await getEmployees(payload.adminId);
      if (total >= 15) {
        return NextResponse.json({
          error: 'لقد وصلت للحد الأقصى لعدد العاملين في باقة أساسي (15 عاملين). يرجى الترقية لالباقة الاحترافية للحصول على عدد أكبر.'
        }, { status: 403 });
      }
    } else if (admin.plan === 'pro') {
      const { total } = await getEmployees(payload.adminId);
      if (total >= 25) {
        return NextResponse.json({
          error: 'لقد وصلت للحد الأقصى لعدد العاملين في الباقة الاحترافية (25 عامل). يرجى الترقية لباقة الأعمال للحصول على عدد أكبر.'
        }, { status: 403 });
      }
    } else if (admin.plan === 'business') {
      const { total } = await getEmployees(payload.adminId);
      if (total >= 50) {
        return NextResponse.json({
          error: 'لقد وصلت للحد الأقصى لعدد العاملين في باقة الأعمال (50 عامل).'
        }, { status: 403 });
      }
    }

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // Hash password before saving
    const hashedPassword = await hashPassword(password);

    const employee = await createEmployee({
      adminId: payload.adminId,
      name,
      username,
      password: hashedPassword,
      isDelivery: isDelivery || false,
      isWaiter: isWaiter || false,
      ...(imageUrl != null && { imageUrl: String(imageUrl) }),
      ...(phone != null && phone !== '' && { phone: String(phone).trim() }),
      ...(color != null && typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color) && { color }),
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// الحصول على قائمة العاملين
export async function GET(request: NextRequest) {
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

    // Only admins can view employees list
    if (!payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { employees, total } = await getEmployees(payload.adminId, { page, limit });
    return NextResponse.json({
      employees,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}
