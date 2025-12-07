import { NextResponse } from 'next/server';
import { getAdminByUsername } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const admin = await getAdminByUsername(username);

    if (!admin || admin.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // إنشاء session token
    const sessionToken = createSessionToken(admin.id, admin.username);

    // نرجع بيانات الأدمن بدون كلمة المرور + session token
    const { password: _, ...sanitizedAdmin } = admin;
    return NextResponse.json({
      ...sanitizedAdmin,
      sessionToken,
    });
  } catch (error) {
    console.error('Error in POST /api/auth:', error);
    return NextResponse.json({
      error: 'Failed to authenticate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
