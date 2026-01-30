import { NextResponse } from 'next/server';
import { getMenuItems, createMenuItem, getMenuLists, getMenuList, getAdmin } from '@/lib/db';
import { verifySessionToken, getAuthHeader } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');

    const items = await getMenuItems(listId || undefined);
    const lists = await getMenuLists();

    return NextResponse.json({ items, lists });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // التحقق من الـ token
    const token = getAuthHeader(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, price, discountedPrice, imageUrl, description, listId } = body;

    if (!name || price === undefined || !listId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // التحقق من الملكية - تأكد أن القائمة تنتمي للـ admin الحالي
    const list = await getMenuList(listId);
    if (!list || list.adminId !== session.adminId) {
      return NextResponse.json({ error: 'Forbidden: You can only add items to your own lists' }, { status: 403 });
    }

    // التحقق من عدد العناصر للخطة المجانية أو المنتهية
    const admin = await getAdmin(session.adminId);
    if (admin) {
      const isPlanActive = () => {
        if (!admin.plan || admin.plan === 'free') return false;
        if (!admin.subscriptionEndsAt) return false;
        const expiryDate = new Date(admin.subscriptionEndsAt);
        return expiryDate >= new Date();
      };

      if (!isPlanActive()) {
        // حساب إجمالي العناصر الحالية للـ admin
        const allLists = await getMenuLists();
        const adminLists = allLists.filter(l => l.adminId === session.adminId);
        const adminListIds = adminLists.map(l => l.id);

        const allItems = await getMenuItems();
        const adminItemsCount = allItems.filter(item => adminListIds.includes(item.listId)).length;

        if (adminItemsCount >= 15) {
          return NextResponse.json({
            error: 'عذراً، لقد وصلت للحد الأقصى للعناصر في الخطة المجانية (15 عنصر). يرجى الترقية لإضافة المزيد.'
          }, { status: 403 });
        }
      }
    }

    const newItem = await createMenuItem({
      name,
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
      imageUrl: imageUrl || undefined,
      description,
      listId
    });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
