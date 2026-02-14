import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrderDetails, getEmployee, getAdmin, checkPlanAndAutoDisable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

/** PATCH تحديث بيانات عميل الطلب (اسم، رقم، عنوان) — نفس صلاحية تغيير الحالة */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifySessionToken(authHeader.slice(7));
    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    const { orderId } = await context.params;
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    const isAdmin = payload.adminId && order.adminId === payload.adminId;
    if (payload.employeeId && !payload.adminId) {
      const employee = await getEmployee(payload.employeeId);
      if (employee) {
        const admin = await getAdmin(employee.adminId);
        if (admin) {
          const planActive = await checkPlanAndAutoDisable(admin, 'basic');
          if (!planActive || !admin.enableDeliveryEmployees) {
            return NextResponse.json({ error: 'عمال التوصيل معطلين حالياً' }, { status: 403 });
          }
        }
      }
    }
    const isAssignedEmployee = payload.employeeId && order.assignedTo === payload.employeeId;
    let isAnyDeliveryEmployee = false;
    if (payload.employeeId && order.assignedTo === 'ANY_DELIVERY') {
      const employee = await getEmployee(payload.employeeId);
      if (employee?.isDelivery) isAnyDeliveryEmployee = true;
    }
    if (!isAdmin && !isAssignedEmployee && !isAnyDeliveryEmployee) {
      return NextResponse.json({ error: 'غير مصرح - يمكن فقط للعامل المُعيَّن تحديث هذا الطلب' }, { status: 403 });
    }

    const body = await request.json();
    const updates: { customerName?: string; customerPhone?: string; customerAddress?: string } = {};
    if (body.customerName !== undefined) updates.customerName = String(body.customerName);
    if (body.customerPhone !== undefined && order.orderType !== 'website') updates.customerPhone = String(body.customerPhone);
    if (body.customerAddress !== undefined) updates.customerAddress = String(body.customerAddress);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'لا توجد حقول للتحديث' }, { status: 400 });
    }

    const updatedOrder = await updateOrderDetails(orderId, updates);
    if (!updatedOrder) {
      return NextResponse.json({ error: 'فشل تحديث بيانات الطلب' }, { status: 500 });
    }
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order details:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث بيانات الطلب', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
