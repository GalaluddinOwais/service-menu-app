import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrderStatus } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> | { orderId: string } }
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

    // Handle both Promise and non-Promise params for compatibility
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { orderId } = params;

    console.log('Updating order status:', { orderId, newStatus: status, adminId: payload.adminId });

    // Check if order exists and belongs to the admin
    const order = await getOrder(orderId);

    if (!order) {
      console.log('Order not found:', orderId);
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    if (order.adminId !== payload.adminId) {
      console.log('Permission denied:', { orderAdmin: order.adminId, requestAdmin: payload.adminId });
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
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
