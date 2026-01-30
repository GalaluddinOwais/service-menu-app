import { NextRequest, NextResponse } from 'next/server';
import { getTableOrder, updateTableOrderStatus, getEmployee, getAdmin, checkPlanAndAutoDisable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json();
    const { status, previousStatus } = body;

    // Validate status
    const validStatuses = ['pending', 'read', 'served', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
    }

    // Await params as required by Next.js 15
    const { id } = await context.params;

    console.log('Updating table order status:', { orderId: id, newStatus: status, userId: payload.adminId || payload.employeeId });

    // Check if order exists
    const order = await getTableOrder(id);

    if (!order) {
      console.log('Table order not found:', id);
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // التحقق من الصلاحية:
    // 1. الأدمن يمكنه تعديل أي طلب يخصه
    // 2. النادل فقط (isWaiter = true) يمكنه تعديل طلبات الطاولة (إذا كان enableWaiters مفعل)
    const isAdmin = payload.adminId && order.adminId === payload.adminId;

    let isWaiter = false;
    if (payload.employeeId) {
      const employee = await getEmployee(payload.employeeId);
      if (employee && employee.isWaiter) {
        // التحقق من أن الندلاء مفعلين وأن الخطة سارية
        const admin = await getAdmin(employee.adminId);
        if (admin) {
          const planActive = await checkPlanAndAutoDisable(admin, 'pro');
          if (!planActive || !admin.enableWaiters) {
            return NextResponse.json({ error: 'الندلاء معطلين حالياً' }, { status: 403 });
          }
        }
        isWaiter = true;
      }
    }

    if (!isAdmin && !isWaiter) {
      console.log('Permission denied:', { orderAdmin: order.adminId, userId: payload.adminId || payload.employeeId, isWaiter });
      return NextResponse.json({ error: 'غير مصرح - النوادل فقط يمكنهم تعديل طلبات الطاولة' }, { status: 403 });
    }

    const currentStatus = order.status || 'pending';
    const tableOrderLevel: Record<string, number> = { pending: 0, read: 1, served: 2, completed: 3 };

    // باقة البزنس فقط: إذا الحالة المطلوبة = الحالة الحالية، نرجع نجاح مع تنبيه بدون كتابة (وربما تأخير إن أُرسل previousStatus)
    const admin = await getAdmin(order.adminId);
    if (admin && (await checkPlanAndAutoDisable(admin, 'business'))) {
      if (currentStatus === status) {
        const isDowngradeFromUi = previousStatus && validStatuses.includes(previousStatus) &&
          (tableOrderLevel[previousStatus] ?? 0) > (tableOrderLevel[status] ?? 0);
        return NextResponse.json({
          success: true,
          status,
          order,
          alreadyInState: true,
          ...(isDowngradeFromUi && { statusDowngrade: true, previousStatus }),
        });
      }
    }

    // Update order status
    const updatedOrder = await updateTableOrderStatus(id, status);

    if (!updatedOrder) {
      console.log('Failed to update table order status');
      return NextResponse.json({ error: 'فشل تحديث الحالة' }, { status: 500 });
    }

    // باقة البزنس فقط: إذا التحديث كان تأخيراً للحالة (تراجع)، نرجع تنبيه للواجهة
    const isDowngrade = admin && (await checkPlanAndAutoDisable(admin, 'business')) &&
      (tableOrderLevel[currentStatus] ?? 0) > (tableOrderLevel[status] ?? 0);
    if (isDowngrade) {
      return NextResponse.json({ success: true, status, order: updatedOrder, statusDowngrade: true, previousStatus: currentStatus });
    }

    console.log('Table order status updated successfully:', updatedOrder);
    return NextResponse.json({ success: true, status, order: updatedOrder });
  } catch (error) {
    console.error('Error updating table order status:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    return NextResponse.json(
      { error: 'خطأ في تحديث حالة الطلب', details: errorMessage },
      { status: 500 }
    );
  }
}
