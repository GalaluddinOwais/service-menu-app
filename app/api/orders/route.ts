import { NextResponse } from 'next/server';
import { createOrder, getOrders } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminId, orderType, items, totalPrice, totalDiscount, customerName, customerPhone } = body;

    // التحقق من البيانات المطلوبة
    if (!adminId || !orderType || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['website', 'whatsapp'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    }

    // إزالة id من العناصر (نحتفظ فقط بالبيانات المهمة)
    const sanitizedItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      ...(item.discountedPrice && { discountedPrice: item.discountedPrice }),
      ...(item.imageUrl && { imageUrl: item.imageUrl }),
    }));

    const newOrder = await createOrder({
      adminId,
      orderType,
      items: sanitizedItems,
      totalPrice: totalPrice || 0,
      totalDiscount: totalDiscount || 0,
      ...(customerName && { customerName }),
      ...(customerPhone && { customerPhone }),
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    const orders = await getOrders(adminId || undefined);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
