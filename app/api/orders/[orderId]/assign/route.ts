import { NextRequest, NextResponse } from 'next/server';
import { assignOrderToEmployee, getOrder } from '@/lib/db';
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

    // Only admins can assign employees
    if (!payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { orderId } = await context.params;
    const { employeeId } = await request.json();

    const updatedOrder = await assignOrderToEmployee(orderId, employeeId);
    if (!updatedOrder) {
      return NextResponse.json({ error: 'فشل تعيين العامل' }, { status: 500 });
    }

    // Verify ownership after assignment
    if (updatedOrder.adminId !== payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error assigning employee:', error);
    return NextResponse.json({ error: 'Failed to assign employee' }, { status: 500 });
  }
}
