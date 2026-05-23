import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { getAdmin, setSubscriptionPending } from '@/lib/db';

const ACCEPT_BASE = process.env.ACCEPT_BASE_URL || 'https://accept.paymob.com';
const PLANS: Record<string, { priceCents: number }> = {
  basic: { priceCents: 99 * 100 },
  pro: { priceCents: 149 * 100 },
  business: { priceCents: 199 * 100 },
};

/** الحصول على توكن من Accept (api_key أو username/password) أو استخدام المفتاح كتوكن */
async function getAcceptToken(): Promise<{ token: string; merchantId: number }> {
  const apiKey = process.env.ACCEPT_API_KEY;
  if (!apiKey) throw new Error('ACCEPT_API_KEY غير معرّف. أضفه في ملف .env.local ثم أعد تشغيل السيرفر.');

  const username = process.env.ACCEPT_USERNAME;
  const password = process.env.ACCEPT_PASSWORD;
  if (username && password) {
    const res = await fetch(`${ACCEPT_BASE}/api/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      const token = data.token;
      const merchantId = data.profile?.id ?? data.merchant_id;
      if (token && merchantId != null) return { token, merchantId: Number(merchantId) };
    }
  }

  const res = await fetch(`${ACCEPT_BASE}/api/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (res.ok) {
    const data = await res.json();
    const token = data.token;
    const merchantId = data.profile?.id ?? data.merchant_id;
    if (token && merchantId != null) return { token, merchantId: Number(merchantId) };
  }

  const merchantIdEnv = process.env.ACCEPT_MERCHANT_ID;
  if (merchantIdEnv) {
    return { token: apiKey, merchantId: Number(merchantIdEnv) };
  }
  const errText = await res.text();
  console.error('Accept auth failed:', res.status, errText);
  throw new Error('فشل الاتصال ببوابة الدفع');
}

/** إنشاء طلب (Order) في Accept */
async function createAcceptOrder(
  token: string,
  merchantId: number,
  amountCents: number,
  merchantOrderId: string
): Promise<number> {
  const res = await fetch(`${ACCEPT_BASE}/api/ecommerce/orders?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      delivery_needed: false,
      merchant_id: merchantId,
      amount_cents: amountCents,
      currency: 'EGP',
      items: [],
      merchant_order_id: merchantOrderId,
      shipping_data: {
        first_name: 'N/A',
        last_name: 'N/A',
        email: 'subscription@menu.app',
        phone_number: '0000000000',
        apartment: 'N/A',
        floor: 'N/A',
        street: 'N/A',
        building: 'N/A',
        city: 'N/A',
        state: 'N/A',
        country: 'EGY',
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Accept create order failed:', res.status, errText);
    let errMessage = 'فشل إنشاء طلب الدفع';
    try {
      const errJson = JSON.parse(errText);
      if (errJson.message) errMessage += `: ${errJson.message}`;
      else if (errJson.detail || errJson.error) errMessage += `: ${errJson.detail || errJson.error}`;
    } catch {
      if (errText && errText.length < 150) errMessage += `: ${errText}`;
    }
    throw new Error(errMessage);
  }
  const data = await res.json();
  const orderId = data.id ?? data.order_id;
  if (orderId == null) throw new Error('لم تُرجع البوابة معرف الطلب');
  return Number(orderId);
}

/** إنشاء مفتاح دفع (Payment Key) لعرض صفحة البطاقة */
async function createPaymentKey(
  token: string,
  orderId: number,
  amountCents: number,
  billingData: { first_name: string; last_name: string; email: string; phone_number: string }
): Promise<string> {
  const integrationId = process.env.ACCEPT_INTEGRATION_ID;
  if (!integrationId) throw new Error('ACCEPT_INTEGRATION_ID غير معرّف');

  const res = await fetch(`${ACCEPT_BASE}/api/acceptance/payment_keys?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount_cents: amountCents,
      currency: 'EGP',
      card_integration_id: Number(integrationId),
      order_id: orderId,
      billing_data: {
        ...billingData,
        apartment: 'N/A',
        floor: 'N/A',
        street: 'N/A',
        building: 'N/A',
        city: 'N/A',
        state: 'N/A',
        country: 'EGY',
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Accept payment key failed:', res.status, errText);
    throw new Error('فشل إنشاء جلسة الدفع');
  }
  const data = await res.json();
  const paymentToken = data.token;
  if (!paymentToken) throw new Error('لم تُرجع البوابة مفتاح الدفع');
  return paymentToken;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }
    const payload = verifySessionToken(authHeader.slice(7));
    if (!payload?.adminId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول كصاحب متجر' }, { status: 401 });
    }

    const body = await request.json();
    const plan = body.plan as string;
    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'خطة غير صالحة' }, { status: 400 });
    }

    const admin = await getAdmin(payload.adminId);
    if (!admin) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });
    }

    const { priceCents } = PLANS[plan];
    const merchantOrderId = `${payload.adminId}|${plan}|${Date.now()}`;

    const { token, merchantId } = await getAcceptToken();
    const orderId = await createAcceptOrder(token, merchantId, priceCents, merchantOrderId);
    await setSubscriptionPending(String(orderId), { adminId: payload.adminId, plan: plan as 'basic' | 'pro' | 'business' });

    const name = admin.name || admin.username || 'Customer';
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || 'N/A';
    const lastName = parts.slice(1).join(' ') || 'N/A';
    const paymentToken = await createPaymentKey(token, orderId, priceCents, {
      first_name: firstName,
      last_name: lastName,
      email: (admin as unknown as { email?: string }).email || 'subscription@menu.app',
      phone_number: (admin as unknown as { phone?: string }).phone || '0000000000',
    });

    const iframeId = process.env.ACCEPT_IFRAME_ID;
    if (!iframeId) {
      return NextResponse.json({ error: 'ACCEPT_IFRAME_ID غير معرّف' }, { status: 500 });
    }
    const paymentUrl = `${ACCEPT_BASE}/api/acceptance/iframes/${iframeId}?payment_token=${encodeURIComponent(paymentToken)}`;

    return NextResponse.json({ paymentUrl, paymentToken, iframeId });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'فشل إنشاء جلسة الدفع';
    console.error('Payment create-session error:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
