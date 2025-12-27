import { NextResponse } from 'next/server';
import { createTableOrder, getTableOrders } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminId, tableNumber, items, totalPrice, totalDiscount } = body;

    // التحقق من البيانات المطلوبة
    if (!adminId || tableNumber === undefined || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // إزالة id من العناصر (نحتفظ فقط بالبيانات المهمة)
    const sanitizedItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      ...(item.discountedPrice && { discountedPrice: item.discountedPrice }),
      ...(item.imageUrl && { imageUrl: item.imageUrl }),
    }));

    const newOrder = await createTableOrder({
      adminId,
      tableNumber,
      items: sanitizedItems,
      totalPrice: totalPrice || 0,
      totalDiscount: totalDiscount || 0,
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating table order:', error);
    return NextResponse.json({ error: 'Failed to create table order' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const tableNumber = searchParams.get('tableNumber');

    const orders = await getTableOrders(
      adminId || undefined,
      tableNumber ? parseInt(tableNumber) : undefined
    );
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching table orders:', error);
    return NextResponse.json({ error: 'Failed to fetch table orders' }, { status: 500 });
  }
}
