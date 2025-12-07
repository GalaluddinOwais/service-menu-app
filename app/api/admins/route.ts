import { NextResponse } from 'next/server';
import { getAdmins, createAdmin } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // التحقق من مفتاح API
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    const admins = await getAdmins();
    // لا نرجع كلمات المرور في الاستعلام العام
    const sanitizedAdmins = admins.map(({ password, ...admin }) => admin);
    return NextResponse.json(sanitizedAdmins);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // التحقق من مفتاح API
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { username, password, logoUrl, backgroundUrl, theme } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (theme && !['ocean', 'sunset', 'forest', 'royal', 'rose'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    const newAdmin = await createAdmin({
      username,
      password,
      logoUrl,
      backgroundUrl,
      theme: theme || 'ocean',
    });

    // لا نرجع كلمة المرور
    const { password: _, ...sanitizedAdmin } = newAdmin;
    return NextResponse.json(sanitizedAdmin, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admins:', error);
    return NextResponse.json({
      error: 'Failed to create admin',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
