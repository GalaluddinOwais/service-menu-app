import { NextResponse } from 'next/server';
import { getMenuLists, createMenuList } from '@/lib/db';
import { verifySessionToken, getAuthHeader } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    const allLists = await getMenuLists();

    // تصفية القوائم حسب adminId إذا تم تمريره
    const lists = adminId
      ? allLists.filter(list => list.adminId === adminId)
      : allLists;

    return NextResponse.json(lists);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, adminId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!adminId) {
      return NextResponse.json({ error: 'adminId is required' }, { status: 400 });
    }

    // التحقق من أن الـ Admin يحاول إضافة قائمة لنفسه فقط
    if (adminId !== session.adminId) {
      return NextResponse.json({ error: 'Forbidden: Cannot create lists for other admins' }, { status: 403 });
    }

    const newList = await createMenuList({ name, itemType: 'عنصر', adminId });
    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/lists:', error);
    return NextResponse.json({
      error: 'Failed to create list',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
