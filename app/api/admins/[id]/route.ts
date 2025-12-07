import { NextResponse } from 'next/server';
import { getAdmin, updateAdmin, deleteAdmin } from '@/lib/db';
import { verifySessionToken, getAuthHeader } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من مفتاح API
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    const { id } = await params;
    const admin = await getAdmin(id);

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // لا نرجع كلمة المرور
    const { password, ...sanitizedAdmin } = admin;
    return NextResponse.json(sanitizedAdmin);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admin' }, { status: 500 });
  }
}

export async function PUT(
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

    // جلب الأدمن الحالي
    const existingAdmin = await getAdmin(id);
    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // التحقق من الملكية - يمكن للأدمن تعديل بياناته فقط
    if (existingAdmin.id !== session.adminId) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own profile' }, { status: 403 });
    }

    const body = await request.json();
    const { username, currentPassword, newPassword, logoUrl, backgroundUrl, theme, welcomeMessage, contactMessage } = body;

    // التحقق من كلمة المرور فقط إذا أراد تغيير كلمة المرور
    if (newPassword) {
      if (!currentPassword || currentPassword !== existingAdmin.password) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 401 });
      }
    }

    if (theme && !['ocean', 'sunset', 'forest', 'royal', 'rose'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    const updates: any = {};
    if (username) updates.username = username;
    if (newPassword) updates.password = newPassword;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (backgroundUrl !== undefined) updates.backgroundUrl = backgroundUrl;
    if (theme) updates.theme = theme;
    if (welcomeMessage !== undefined) updates.welcomeMessage = welcomeMessage;
    if (contactMessage !== undefined) updates.contactMessage = contactMessage;

    const updatedAdmin = await updateAdmin(id, updates);

    if (!updatedAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // لا نرجع كلمة المرور
    const { password: _, ...sanitizedAdmin } = updatedAdmin;
    return NextResponse.json(sanitizedAdmin);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من مفتاح API - للمطور فقط
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // جلب الأدمن الحالي
    const existingAdmin = await getAdmin(id);
    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // تعديل مباشر - أي حقل في الـ body يتم تحديثه مباشرة
    const updates: any = {};
    if (body.username !== undefined) updates.username = body.username;
    if (body.password !== undefined) updates.password = body.password;
    if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl;
    if (body.backgroundUrl !== undefined) updates.backgroundUrl = body.backgroundUrl;
    if (body.theme !== undefined) updates.theme = body.theme;
    if (body.welcomeMessage !== undefined) updates.welcomeMessage = body.welcomeMessage;
    if (body.contactMessage !== undefined) updates.contactMessage = body.contactMessage;

    const updatedAdmin = await updateAdmin(id, updates);

    if (!updatedAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // لا نرجع كلمة المرور
    const { password: _, ...sanitizedAdmin } = updatedAdmin;
    return NextResponse.json(sanitizedAdmin);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // حماية نقطة النهاية بمفتاح API
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    const success = await deleteAdmin(id);

    if (!success) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}
