import { NextRequest, NextResponse } from 'next/server';
import { assignTableOrderToEmployee, getAdmin, checkPlanAndAutoDisable } from '@/lib/db';
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

    // Only admins can assign employees
    if (!payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await context.params;
    const { employeeId } = await request.json();

    const admin = await getAdmin(payload.adminId);
    const isBusiness = admin && (await checkPlanAndAutoDisable(admin, 'business'));
    const incrementAssigned = isBusiness && employeeId;

    const updatedOrder = await assignTableOrderToEmployee(id, employeeId, { incrementAssignedCount: incrementAssigned });
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
