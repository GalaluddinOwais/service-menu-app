import { NextResponse } from 'next/server';
import { getAdminByUsername } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const admin = await getAdminByUsername(username);

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // نرجع فقط البيانات العامة (بدون كلمة المرور)
    const { password, ...publicData } = admin;
    return NextResponse.json(publicData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admin' }, { status: 500 });
  }
}
