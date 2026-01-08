import { NextRequest, NextResponse } from 'next/server';
import { getOrder, deleteOrder } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export async function DELETE(
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

    // Await params as required by Next.js 15
    const { orderId } = await context.params;

    console.log('Deleting order:', { orderId, adminId: payload.adminId });

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

    // Delete order
    const deleted = await deleteOrder(orderId);

    if (!deleted) {
      console.log('Failed to delete order');
      return NextResponse.json({ error: 'فشل حذف الطلب' }, { status: 500 });
    }

    console.log('Order deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    return NextResponse.json(
      { error: 'خطأ في حذف الطلب', details: errorMessage },
      { status: 500 }
    );
  }
}
