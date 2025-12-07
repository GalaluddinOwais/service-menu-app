import { NextResponse } from 'next/server';
import { getMenuItem, updateMenuItem, deleteMenuItem, getMenuList } from '@/lib/db';
import { verifySessionToken, getAuthHeader } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await getMenuItem(id);

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, price, description, listId } = body;

    // التحقق من الملكية
    const existingItem = await getMenuItem(id);
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const itemList = await getMenuList(existingItem.listId);
    if (!itemList || itemList.adminId !== session.adminId) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own items' }, { status: 403 });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (price !== undefined) updates.price = Number(price);
    if (description !== undefined) updates.description = description;
    if (listId) {
      // إذا تم تغيير القائمة، تحقق من أن القائمة الجديدة تنتمي للـ admin الحالي
      const newList = await getMenuList(listId);
      if (!newList || newList.adminId !== session.adminId) {
        return NextResponse.json({ error: 'Forbidden: You can only move items to your own lists' }, { status: 403 });
      }
      updates.listId = listId;
    }

    const updatedItem = await updateMenuItem(id, updates);

    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // التحقق من الملكية
    const existingItem = await getMenuItem(id);
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const itemList = await getMenuList(existingItem.listId);
    if (!itemList || itemList.adminId !== session.adminId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own items' }, { status: 403 });
    }

    const success = await deleteMenuItem(id);

    if (!success) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}
