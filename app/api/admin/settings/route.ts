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

    // دالة مساعدة للتحقق من صلاحية الخطة والميزة
    const isPlanActiveFor = (requiredPlan: 'basic' | 'pro' | 'business') => {
      if (!admin.plan || admin.plan === 'free') return false;
      if (!admin.subscriptionEndsAt) return false;

      const expiryDate = new Date(admin.subscriptionEndsAt);
      if (expiryDate < new Date()) return false;

      const planLevels = { free: 0, basic: 1, pro: 2, business: 3 };
      return planLevels[admin.plan] >= planLevels[requiredPlan];
    };

    // التحقق من الصلاحيات عند تفعيل عمال التوصيل
    if (body.enableDeliveryEmployees === true && !isPlanActiveFor('basic')) {
      return NextResponse.json({
        error: 'عذراً، ميزة تفعيل عمال التوصيل تتطلب باقة أساسي فأعلى واشتراكاً سارياً'
      }, { status: 403 });
    }

    // التحقق من الصلاحيات عند تفعيل الندلاء
    if (body.enableWaiters === true && !isPlanActiveFor('pro')) {
      return NextResponse.json({
        error: 'عذراً، ميزة تفعيل الندلاء تتطلب الباقة الاحترافية فأعلى واشتراكاً سارياً'
      }, { status: 403 });
    }

    // التحقق من الصلاحيات عند تفعيل استقبال الطلبات
    if (body.isAcceptingOrders === true && !isPlanActiveFor('basic')) {
      return NextResponse.json({
        error: 'عذراً، ميزة استقبال الطلبات تتطلب باقة أساسي فأعلى واشتراكاً سارياً'
      }, { status: 403 });
    }

    // التحقق من الصلاحيات عند تفعيل طلبات الطاولة
    if (body.isAcceptingTableOrders === true && !isPlanActiveFor('pro')) {
      return NextResponse.json({
        error: 'عذراً، ميزة طلبات الطاولة تتطلب الباقة الاحترافية فأعلى واشتراكاً سارياً'
      }, { status: 403 });
    }

    // Update only the fields that are provided
    const updatedAdmin = await updateAdmin(payload.adminId, {
      ...admin,
      ...(body.isAcceptingOrders !== undefined && { isAcceptingOrders: body.isAcceptingOrders }),
      ...(body.isAcceptingTableOrders !== undefined && { isAcceptingTableOrders: body.isAcceptingTableOrders }),
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
