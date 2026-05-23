import crypto from 'crypto';
import { getAndClearSubscriptionPending, getAdmin, updateAdmin } from '@/lib/db';

const HMAC_SECRET = process.env.ACCEPT_HMAC_SECRET || '';

/**
 * الترتيب الأبجدي الرسمي لحقول PayMob Accept HMAC
 */
function buildHmacString(obj: Record<string, unknown>): string {
  const order = obj.order as Record<string, unknown> | undefined;
  const sourceData = obj.source_data as Record<string, unknown> | undefined;
  const parts = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    order?.id,
    obj.owner,
    obj.pending,
    sourceData?.pan,
    sourceData?.sub_type,
    sourceData?.type,
    obj.success,
  ];
  return parts.map((v) => (v === undefined || v === null ? '' : String(v))).join('');
}

export function verifyHmac(obj: Record<string, unknown>, receivedHmac: string): boolean {
  if (!HMAC_SECRET) return false;
  const str = buildHmacString(obj);
  const computed = crypto.createHmac('sha512', HMAC_SECRET).update(str, 'utf8').digest('hex');
  return computed === receivedHmac;
}

/** بناء obj من query params (redirect callback) */
export function buildObjFromSearchParams(params: URLSearchParams): Record<string, unknown> {
  const get = (k: string) => params.get(k) ?? undefined;
  const orderId = get('order');
  const merchantOrderId = get('merchant_order_id');
  return {
    amount_cents: get('amount_cents'),
    created_at: get('created_at'),
    currency: get('currency'),
    error_occured: get('error_occured'),
    has_parent_transaction: get('has_parent_transaction'),
    id: get('id'),
    integration_id: get('integration_id'),
    is_3d_secure: get('is_3d_secure'),
    is_auth: get('is_auth'),
    is_capture: get('is_capture'),
    is_refunded: get('is_refunded'),
    is_standalone_payment: get('is_standalone_payment'),
    is_voided: get('is_voided'),
    order: orderId != null ? { id: orderId, merchant_order_id: merchantOrderId } : undefined,
    owner: get('owner'),
    pending: get('pending'),
    source_data: {
      pan: get('source_data.pan'),
      sub_type: get('source_data.sub_type'),
      type: get('source_data.type'),
    },
    success: get('success'),
    merchant_order_id: merchantOrderId,
  };
}

function getSubscriptionEndDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export async function processPaymentCallback(obj: Record<string, unknown>): Promise<{ ok: boolean; message?: string }> {
  const success = obj.success === true || obj.success === 'true';
  const orderObj = obj.order as Record<string, unknown> | undefined;
  const orderId = orderObj?.id != null ? String(orderObj.id) : null;
  let merchantOrderId: string | null = null;
  if (orderObj?.merchant_order_id != null) merchantOrderId = String(orderObj.merchant_order_id);
  if (!merchantOrderId && typeof obj.merchant_order_id === 'string') {
    merchantOrderId = obj.merchant_order_id as string;
  }

  if (!success) {
    if (orderId) await getAndClearSubscriptionPending(orderId);
    return { ok: true, message: 'Payment not successful' };
  }

  let adminId: string | null = null;
  let plan: 'basic' | 'pro' | 'business' | null = null;

  const pending = orderId ? await getAndClearSubscriptionPending(orderId) : null;
  if (pending) {
    adminId = pending.adminId;
    plan = pending.plan;
  }
  if (!adminId || !plan) {
    const match = merchantOrderId && merchantOrderId.match(/^([^|]+)\|(basic|pro|business)(?:\|.+)?$/);
    if (match) {
      adminId = match[1];
      plan = match[2] as 'basic' | 'pro' | 'business';
    }
  }

  if (!adminId || !plan) {
    console.error('Payment callback: could not resolve adminId/plan', { orderId, merchantOrderId });
    return { ok: true, message: 'Unknown order' };
  }

  const admin = await getAdmin(adminId);
  if (!admin) return { ok: true, message: 'Admin not found' };

  const subscriptionEndsAt = getSubscriptionEndDate();
  await updateAdmin(adminId, { plan, subscriptionEndsAt });
  console.info(`Payment callback: activated plan=${plan} for admin=${adminId} until ${subscriptionEndsAt}`);
  return { ok: true, message: 'OK' };
}
