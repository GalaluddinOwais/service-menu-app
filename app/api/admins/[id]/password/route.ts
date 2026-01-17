import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, updateAdmin } from '@/lib/db';
import { verifySessionToken, comparePassword, hashPassword } from '@/lib/auth';

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

    const { id } = await context.params;

    // Verify admin is updating their own account
    if (payload.adminId !== id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const existingAdmin = await getAdmin(id);
    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // التحقق من كلمة المرور الحالية
    if (!currentPassword) {
      return NextResponse.json({ error: 'كلمة المرور الحالية مطلوبة' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة مطلوبة' }, { status: 400 });
    }

    // Compare current password with hashed password
    const isPasswordValid = await comparePassword(currentPassword, existingAdmin.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 });
    }

    // Hash new password before saving
    const hashedNewPassword = await hashPassword(newPassword);

    // تحديث كلمة المرور فقط
    const updatedAdmin = await updateAdmin(id, {
      password: hashedNewPassword,
    });

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
