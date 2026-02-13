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
    const { name, username, currentPassword, newPassword, logoUrl, backgroundUrl, theme, cardStyle, fontFamily, welcomeMessage, contactMessage, whatsappNumber, isAcceptingOrders, isAcceptingOrdersViaWhatsapp, isAcceptingTableOrders, tablesCount, showDeliveryStaff, showWaiterStaff } = body;

    // دالة مساعدة للتحقق من صلاحية الخطة والميزة
    const isPlanActiveFor = (requiredPlan: 'basic' | 'pro' | 'business') => {
      if (!existingAdmin.plan || existingAdmin.plan === 'free') return false;
      if (!existingAdmin.subscriptionEndsAt) return false;

      const expiryDate = new Date(existingAdmin.subscriptionEndsAt);
      if (expiryDate < new Date()) return false;

      const planLevels = { free: 0, basic: 1, pro: 2, business: 3 };
      return planLevels[existingAdmin.plan] >= planLevels[requiredPlan];
    };

    // التحقق من الصلاحيات عند تفعيل الطلب عبر الموقع
    if (isAcceptingOrders === true && !isPlanActiveFor('basic')) {
      return NextResponse.json({
        error: 'عذراً، ميزة الطلب عبر الموقع تتطلب باقة برو فأعلى واشتراكاً سارياً'
      }, { status: 403 });
    }

    // التحقق من الصلاحيات عند تفعيل طلبات الطاولة
    if (isAcceptingTableOrders === true && !isPlanActiveFor('pro')) {
      return NextResponse.json({
        error: 'عذراً، ميزة طلبات الطاولات تتطلب الباقة الاحترافية فأعلى واشتراكاً سارياً'
      }, { status: 403 });
    }

    // التحقق من كلمة المرور فقط إذا أراد تغيير كلمة المرور
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'كلمة المرور الحالية مطلوبة لتغيير كلمة المرور' }, { status: 400 });
      }
      if (currentPassword !== existingAdmin.password) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 });
      }
    }

    if (theme && !['ocean', 'sunset', 'forest', 'royal', 'rose', 'midnight', 'coral', 'emerald', 'lavender', 'crimson', 'coffee', 'canary'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    if (cardStyle && !['rounded', 'sharp', 'bordered', 'modern', 'soft', 'fancy'].includes(cardStyle)) {
      return NextResponse.json({ error: 'Invalid card style' }, { status: 400 });
    }

    if (fontFamily && !['cairo', 'baloo-bhaijaan', 'zain'].includes(fontFamily)) {
      return NextResponse.json({ error: 'Invalid font family' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (username) updates.username = username;
    if (newPassword) updates.password = newPassword;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (backgroundUrl !== undefined) updates.backgroundUrl = backgroundUrl;
    if (theme) updates.theme = theme;
    if (cardStyle !== undefined) updates.cardStyle = cardStyle;
    if (fontFamily !== undefined) updates.fontFamily = fontFamily;
    if (welcomeMessage !== undefined) updates.welcomeMessage = welcomeMessage;
    if (contactMessage !== undefined) updates.contactMessage = contactMessage;
    if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber;
    if (isAcceptingOrders !== undefined) updates.isAcceptingOrders = isAcceptingOrders;
    if (isAcceptingOrdersViaWhatsapp !== undefined) updates.isAcceptingOrdersViaWhatsapp = isAcceptingOrdersViaWhatsapp;
    if (isAcceptingTableOrders !== undefined) updates.isAcceptingTableOrders = isAcceptingTableOrders;
    if (tablesCount !== undefined) updates.tablesCount = tablesCount;
    if (showDeliveryStaff !== undefined) updates.showDeliveryStaff = showDeliveryStaff;
    if (showWaiterStaff !== undefined) updates.showWaiterStaff = showWaiterStaff;

    const updatedAdmin = await updateAdmin(id, updates);

    if (!updatedAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // لا نرجع كلمة المرور
    const { password: _, ...sanitizedAdmin } = updatedAdmin;
    return NextResponse.json(sanitizedAdmin);
  } catch (error) {
    if (error instanceof Error && error.message === 'Username already exists') {
      return NextResponse.json({ error: 'اسم المستخدم مسجل بالفعل، يرجى اختيار اسم آخر' }, { status: 409 });
    }
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
    if (body.cardStyle !== undefined) updates.cardStyle = body.cardStyle;
    if (body.fontFamily !== undefined) updates.fontFamily = body.fontFamily;
    if (body.welcomeMessage !== undefined) updates.welcomeMessage = body.welcomeMessage;
    if (body.contactMessage !== undefined) updates.contactMessage = body.contactMessage;
    if (body.whatsappNumber !== undefined) updates.whatsappNumber = body.whatsappNumber;
    if (body.isAcceptingOrders !== undefined) updates.isAcceptingOrders = body.isAcceptingOrders;
    if (body.isAcceptingOrdersViaWhatsapp !== undefined) updates.isAcceptingOrdersViaWhatsapp = body.isAcceptingOrdersViaWhatsapp;
    if (body.isAcceptingTableOrders !== undefined) updates.isAcceptingTableOrders = body.isAcceptingTableOrders;
    if (body.tablesCount !== undefined) updates.tablesCount = body.tablesCount;
    if (body.showDeliveryStaff !== undefined) updates.showDeliveryStaff = body.showDeliveryStaff;
    if (body.showWaiterStaff !== undefined) updates.showWaiterStaff = body.showWaiterStaff;

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
