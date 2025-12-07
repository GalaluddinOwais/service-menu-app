import { NextResponse } from 'next/server';
import { getMenuItems, createMenuItem, getMenuLists, getMenuList } from '@/lib/db';
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
    const { name, price, description, listId } = body;

    if (!name || price === undefined || !listId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // التحقق من الملكية - تأكد أن القائمة تنتمي للـ admin الحالي
    const list = await getMenuList(listId);
    if (!list || list.adminId !== session.adminId) {
      return NextResponse.json({ error: 'Forbidden: You can only add items to your own lists' }, { status: 403 });
    }

    const newItem = await createMenuItem({ name, price: Number(price), description, listId });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
