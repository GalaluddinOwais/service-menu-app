import { NextRequest, NextResponse } from 'next/server';
import { getEmployee, getAdmin, getEmployees, getUserStats, checkPlanAndAutoDisable, updateEmployee } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import type { UserStats } from '@/lib/db';

/** أوزان التقديم: 12→1, 13→2, 14→3, 23→1, 24→2, 34→1 */
const forwardWeight = (n: number) => (n % 10) - Math.floor(n / 10);
/** أوزان التأخير: 43→1, 42→2, 41→3, 32→1, 31→2, 21→1 */
const downgradeWeight = (n: number) => Math.floor(n / 10) - (n % 10);

function sumForwardWeighted(s: UserStats, prefix: 'delivery' | 'table'): number {
  const keys = [12, 13, 14, 23, 24, 34] as const;
  return keys.reduce((a, n) => {
    const key = `${prefix}Forward${Math.floor(n / 10)}${n % 10}` as keyof UserStats;
    const count = Number(s[key]) || 0;
    return a + count * forwardWeight(n);
  }, 0);
}

function sumDowngradeWeighted(s: UserStats, prefix: 'delivery' | 'table'): number {
  const keys = [43, 42, 41, 32, 31, 21] as const;
  return keys.reduce((a, n) => {
    const key = `${prefix}Downgrade${Math.floor(n / 10)}${n % 10}` as keyof UserStats;
    const count = Number(s[key]) || 0;
    return a + count * downgradeWeight(n);
  }, 0);
}

/** GET /api/employee/rating-info — للموظف: النقاط، الكفاءة، الترتيب العام، ترتيب وسط عمال التوصيل، ترتيب وسط الندلاء (باقة البزنس) */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifySessionToken(authHeader.slice(7));
    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const employeeId = payload.employeeId;
    const employee = await getEmployee(employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'العامل غير موجود' }, { status: 404 });
    }

    const admin = await getAdmin(employee.adminId);
    if (!admin) {
      return NextResponse.json({ error: 'الأدمن غير موجود' }, { status: 404 });
    }

    const planActive = await checkPlanAndAutoDisable(admin, 'business');
    if (!planActive || !admin.employeeRatingEnable) {
      return NextResponse.json({ enabled: false });
    }

    const CACHE_MS = 24 * 60 * 60 * 1000; // 24 ساعة
    const cache = employee.ratingInfoCache;
    if (cache?.cachedAt) {
      const age = Date.now() - new Date(cache.cachedAt).getTime();
      if (age < CACHE_MS) {
        return NextResponse.json({
          enabled: true,
          points: cache.points,
          efficiency: cache.efficiency,
          ...(cache.rank !== undefined && { rank: cache.rank }),
          ...(cache.rankAmongDelivery !== undefined && { rankAmongDelivery: cache.rankAmongDelivery }),
          ...(cache.rankAmongWaiters !== undefined && { rankAmongWaiters: cache.rankAmongWaiters }),
        });
      }
    }

    const scaleDeliveryForward = admin.employeeRatingScaleDeliveryForward ?? 0;
    const scaleDeliveryBackward = admin.employeeRatingScaleDeliveryBackward ?? 0;
    const scaleTableForward = admin.employeeRatingScaleTableForward ?? 0;
    const scaleTableBackward = admin.employeeRatingScaleTableBackward ?? 0;
    const tendencyX = Math.max(0, Math.min(1, admin.employeeRatingTendencyX ?? 0.5));

    const { employees } = await getEmployees(admin.id, { page: 1, limit: 500 });
    const allWithStats = await Promise.all(
      employees.map(async (emp) => {
        const stats = await getUserStats(emp.id, 'employee');
        const deliveryForward = sumForwardWeighted(stats, 'delivery');
        const deliveryDowngrade = sumDowngradeWeighted(stats, 'delivery');
        const tableForward = sumForwardWeighted(stats, 'table');
        const tableDowngrade = sumDowngradeWeighted(stats, 'table');
        const pointsDelivery = scaleDeliveryForward * deliveryForward + scaleDeliveryBackward * deliveryDowngrade;
        const pointsTable = scaleTableForward * tableForward + scaleTableBackward * tableDowngrade;
        const S = pointsDelivery + pointsTable;
        const days = emp.createdAt ? Math.max(1, Math.ceil((Date.now() - new Date(emp.createdAt).getTime()) / 86400000)) : 1;
        const R = S / days;
        const RDelivery = pointsDelivery / days;
        const RTable = pointsTable / days;
        const hasAnyActivity = S > 0;
        const hasDeliveryActivity = emp.isDelivery && (pointsDelivery > 0);
        const hasTableActivity = emp.isWaiter && (pointsTable > 0);
        return {
          id: emp.id,
          S,
          R,
          pointsDelivery,
          pointsTable,
          days,
          RDelivery,
          RTable,
          isDelivery: emp.isDelivery,
          isWaiter: emp.isWaiter,
          hasAnyActivity,
          hasDeliveryActivity,
          hasTableActivity,
        };
      })
    );

    const me = allWithStats.find((x) => x.id === employeeId);
    if (!me) {
      return NextResponse.json({ enabled: true, points: 0, efficiency: 0 });
    }

    const body: {
      enabled: true;
      points: number;
      efficiency: number;
      rank?: number;
      rankAmongDelivery?: number;
      rankAmongWaiters?: number;
    } = {
      enabled: true,
      points: me.S,
      efficiency: me.R,
    };

    // الترتيب العام — نقاط وكفاءة كلها، فقط لمن له أي نشاط
    const maxS = Math.max(...allWithStats.map((x) => x.S), 1);
    const maxR = Math.max(...allWithStats.map((x) => x.R), 1);
    const withFinalGeneral = allWithStats
      .filter((x) => x.hasAnyActivity)
      .map((x) => ({
        ...x,
        FinalScoreToRank: (1 - tendencyX) * (x.S / maxS) + tendencyX * (x.R / maxR),
      }))
      .sort((a, b) => b.FinalScoreToRank - a.FinalScoreToRank);
    if (me.hasAnyActivity && withFinalGeneral.length > 0) {
      const generalRank = withFinalGeneral.findIndex((x) => x.id === employeeId) + 1;
      if (generalRank > 0) body.rank = generalRank;
    }

    // ترتيب وسط عمال التوصيل — نقاط وكفاءة التوصيل فقط
    const deliveryOnly = allWithStats.filter((x) => x.hasDeliveryActivity);
    if (deliveryOnly.length > 0) {
      const maxSD = Math.max(...deliveryOnly.map((x) => x.pointsDelivery), 1);
      const maxRD = Math.max(...deliveryOnly.map((x) => x.RDelivery), 1);
      const rankedDelivery = deliveryOnly
        .map((x) => ({
          ...x,
          FinalScoreToRank: (1 - tendencyX) * (x.pointsDelivery / maxSD) + tendencyX * (x.RDelivery / maxRD),
        }))
        .sort((a, b) => b.FinalScoreToRank - a.FinalScoreToRank);
      if (me.hasDeliveryActivity) {
        const deliveryRank = rankedDelivery.findIndex((x) => x.id === employeeId) + 1;
        if (deliveryRank > 0) body.rankAmongDelivery = deliveryRank;
      }
    }

    // ترتيب وسط الندلاء — نقاط وكفاءة النادل فقط
    const waitersOnly = allWithStats.filter((x) => x.hasTableActivity);
    if (waitersOnly.length > 0) {
      const maxST = Math.max(...waitersOnly.map((x) => x.pointsTable), 1);
      const maxRT = Math.max(...waitersOnly.map((x) => x.RTable), 1);
      const rankedWaiters = waitersOnly
        .map((x) => ({
          ...x,
          FinalScoreToRank: (1 - tendencyX) * (x.pointsTable / maxST) + tendencyX * (x.RTable / maxRT),
        }))
        .sort((a, b) => b.FinalScoreToRank - a.FinalScoreToRank);
      if (me.hasTableActivity) {
        const waitersRank = rankedWaiters.findIndex((x) => x.id === employeeId) + 1;
        if (waitersRank > 0) body.rankAmongWaiters = waitersRank;
      }
    }

    await updateEmployee(employeeId, {
      ratingInfoCache: {
        cachedAt: new Date().toISOString(),
        points: body.points,
        efficiency: body.efficiency,
        ...(body.rank !== undefined && { rank: body.rank }),
        ...(body.rankAmongDelivery !== undefined && { rankAmongDelivery: body.rankAmongDelivery }),
        ...(body.rankAmongWaiters !== undefined && { rankAmongWaiters: body.rankAmongWaiters }),
      },
    });

    return NextResponse.json(body);
  } catch (error) {
    console.error('Error in employee rating-info:', error);
    return NextResponse.json({ error: 'خطأ في جلب تقييم العامل' }, { status: 500 });
  }
}
