import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, getEmployees, checkPlanAndAutoDisable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** لون ثابت للأدمن — مطابق لـ bg-amber-400 */
const ADMIN_COLOR = '#1F2937';

function colorFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  h = Math.abs(h) % 360;
  const s = 55, l = 50;
  const a = (s * Math.min(l, 100 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const r = Math.round(f(0) * 255), g = Math.round(f(8) * 255), b = Math.round(f(4) * 255);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/** GET /api/admin/stats/team-colors — id + لون فقط (أدمن + عمال)، باقة البزنس، بدون كاش */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifySessionToken(authHeader.slice(7));
    if (!payload || !payload.adminId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const adminId = payload.adminId;
    const admin = await getAdmin(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'الأدمن غير موجود' }, { status: 404 });
    }

    const planActive = await checkPlanAndAutoDisable(admin, 'business');
    if (!planActive) {
      return NextResponse.json({ error: 'الباقة لا تدعم إحصائيات الفريق' }, { status: 403 });
    }

    const { employees } = await getEmployees(adminId);
    const colors: Record<string, string> = {
      [adminId]: ADMIN_COLOR,
    };
    employees.forEach(emp => {
      colors[emp.id] = emp.color && /^#[0-9A-Fa-f]{6}$/.test(emp.color) ? emp.color : colorFromId(emp.id);
    });

    return NextResponse.json({ colors });
  } catch (error) {
    console.error('Error fetching team colors:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الألوان', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
