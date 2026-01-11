import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/db';
import { verifySessionToken, getAuthHeader } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من Session Token
    const token = getAuthHeader(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    const { id } = await params;
    const admin = await getAdmin(id);

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // التحقق من أن المستخدم يطلب بيانات الأدمن الذي ينتمي إليه
    // الأدمن يمكنه رؤية بياناته، والعامل يمكنه رؤية بيانات الأدمن الذي يعمل لديه
    const isOwnAdmin = session.adminId === admin.id;
    const isAdminEmployee = session.employeeId; // If employee, they can see their admin's data

    if (!isOwnAdmin && !isAdminEmployee) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // لا نرجع كلمة المرور
    const { password, ...sanitizedAdmin } = admin;
    return NextResponse.json(sanitizedAdmin);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admin info' }, { status: 500 });
  }
}
