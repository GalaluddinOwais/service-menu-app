import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  return NextResponse.json({
    url_present: Boolean(url),
    url_host: url ? new URL(url).host : null,
    token_present: Boolean(token),
    token_length: token?.length ?? 0,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    all_kv_keys: Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REDIS')),
  });
}
