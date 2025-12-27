import { NextResponse } from 'next/server';
import { deleteTableOrder } from '@/lib/db';
import { verifySessionToken, getAuthHeader } from '@/lib/auth';

export async function DELETE(
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
    const success = await deleteTableOrder(id);

    if (!success) {
      return NextResponse.json({ error: 'Table order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete table order' }, { status: 500 });
  }
}
