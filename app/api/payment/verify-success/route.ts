import { NextRequest, NextResponse } from 'next/server';
import {
  verifyHmac,
  buildObjFromSearchParams,
  processPaymentCallback,
} from '@/lib/payment-callback';

/**
 * التحقق من HMAC وتفعيل الاشتراك من redirect success.
 * صفحة success ترسل window.location.search هنا.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const search = (body.search as string) || (body.query as string);
    if (!search || typeof search !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing search/query' }, { status: 400 });
    }

    const q = search.startsWith('?') ? search.slice(1) : search;
    const params = new URLSearchParams(q);
    const receivedHmac = params.get('hmac');
    if (!receivedHmac) {
      return NextResponse.json({ ok: false, error: 'Missing hmac' }, { status: 400 });
    }

    const obj = buildObjFromSearchParams(params);
    if (!verifyHmac(obj, receivedHmac)) {
      return NextResponse.json({ ok: false, error: 'Invalid HMAC' }, { status: 401 });
    }

    const result = await processPaymentCallback(obj);
    return NextResponse.json({ ok: result.ok, message: result.message });
  } catch (e) {
    console.error('Payment verify-success error:', e);
    return NextResponse.json({ ok: false, error: 'Error' }, { status: 500 });
  }
}
