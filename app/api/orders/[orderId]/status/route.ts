import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrderStatus, getEmployee, getAdmin } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
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

    const { status } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'read', 'delivering', 'delivered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
    }

    // Await params as required by Next.js 15
    const { orderId } = await context.params;

    console.log('Updating order status:', { orderId, newStatus: status, userId: payload.adminId || payload.employeeId });

    // Check if order exists
    const order = await getOrder(orderId);

    if (!order) {
      console.log('Order not found:', orderId);
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // التحقق من الصلاحية:
    // 1. الأدمن يمكنه تعديل أي طلب يخصه
    // 2. العامل يمكنه تعديل الطلبات المُعيَّنة له (إذا كان enableDeliveryEmployees مفعل)
    // 3. أي عامل توصيل يمكنه تعديل الطلبات المعينة لـ "ANY_DELIVERY" (إذا كان enableDeliveryEmployees مفعل)
    const isAdmin = payload.adminId && order.adminId === payload.adminId;

    // التحقق من أن عمال التوصيل مفعلين قبل السماح للموظف
    if (payload.employeeId && !payload.adminId) {
      const employee = await getEmployee(payload.employeeId);
      if (employee) {
        const admin = await getAdmin(employee.adminId);
        if (!admin?.enableDeliveryEmployees) {
          return NextResponse.json({ error: 'عمال التوصيل معطلين حالياً' }, { status: 403 });
        }
      }
    }

    const isAssignedEmployee = payload.employeeId && order.assignedTo === payload.employeeId;

    // Check if order is assigned to ANY_DELIVERY and user is a delivery employee
    let isAnyDeliveryEmployee = false;
    if (payload.employeeId && order.assignedTo === 'ANY_DELIVERY') {
      const employee = await getEmployee(payload.employeeId);
      if (employee && employee.isDelivery) {
        isAnyDeliveryEmployee = true;
      }
    }

    if (!isAdmin && !isAssignedEmployee && !isAnyDeliveryEmployee) {
      console.log('Permission denied:', { orderAdmin: order.adminId, assignedTo: order.assignedTo, userId: payload.adminId || payload.employeeId });
      return NextResponse.json({ error: 'غير مصرح - يمكن فقط للعامل المُعيَّن تحديث حالة هذا الطلب' }, { status: 403 });
    }

    // Update order status
    const updatedOrder = await updateOrderStatus(orderId, status);

    if (!updatedOrder) {
      console.log('Failed to update order status');
      return NextResponse.json({ error: 'فشل تحديث الحالة' }, { status: 500 });
    }

    console.log('Order status updated successfully:', updatedOrder);
    return NextResponse.json({ success: true, status, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    return NextResponse.json(
      { error: 'خطأ في تحديث حالة الطلب', details: errorMessage },
      { status: 500 }
    );
  }
}
