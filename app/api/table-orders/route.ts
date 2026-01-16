import { NextResponse } from 'next/server';
import { createTableOrder, getTableOrders, getEmployee, getAdmin } from '@/lib/db';
import { verifySessionToken, getAuthHeader } from '@/lib/auth';

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
    // التحقق من Session Token
    const token = getAuthHeader(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    // التحقق من الصلاحيات:
    // 1. الأدمن يمكنه رؤية طلبات الطاولة الخاصة به فقط
    // 2. الموظف يجب أن يكون نادل
    if (session.adminId) {
      // Admin must request their own orders
      if (!adminId || adminId !== session.adminId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }
    } else if (session.employeeId) {
      // Employee must be a waiter
      const employee = await getEmployee(session.employeeId);
      if (!employee || !employee.isWaiter) {
        return NextResponse.json({ error: 'غير مصرح - النوادل فقط يمكنهم الوصول لطلبات الطاولة' }, { status: 403 });
      }
      // ملاحظة: نسمح للنادل بجلب الطلبات حتى لو كان معطلاً
      // التحقق من التفعيل يتم فقط عند تعديل حالة الطلب
    } else {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

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
