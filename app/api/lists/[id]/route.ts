import { NextResponse } from 'next/server';
import { getMenuList, updateMenuList, deleteMenuList } from '@/lib/db';
import { verifySessionToken, getAuthHeader } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const list = await getMenuList(id);

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch list' }, { status: 500 });
  }
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
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // التحقق من الملكية
    const existingList = await getMenuList(id);
    if (!existingList || existingList.adminId !== session.adminId) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own lists' }, { status: 403 });
    }

    const updatedList = await updateMenuList(id, { name });

    if (!updatedList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json(updatedList);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
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
    const existingList = await getMenuList(id);
    if (!existingList || existingList.adminId !== session.adminId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own lists' }, { status: 403 });
    }

    const success = await deleteMenuList(id);

    if (!success) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}
