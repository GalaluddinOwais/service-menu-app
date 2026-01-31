import { NextRequest, NextResponse } from 'next/server';
import {
  getAdmin,
  getEmployees,
  getUserStats,
  checkPlanAndAutoDisable,
  updateAdmin,
} from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import type { UserStats } from '@/lib/db';

export type TeamStatsUser = {
  id: string;
  name: string;
  userType: 'admin' | 'employee';
  stats: UserStats;
};

/** GET /api/admin/stats/team — إحصائيات الأدمن + كل العمال (باقة البزنس فقط) */
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

    const CACHE_MS = 24 * 60 * 60 * 1000; // 24 ساعة
    const cached = admin.adminCachedStats?.team;
    if (cached?.cachedAt) {
      const age = Date.now() - new Date(cached.cachedAt).getTime();
      if (age < CACHE_MS) {
        return NextResponse.json({ users: cached.users, cachedAt: cached.cachedAt });
      }
    }

    const adminStats = await getUserStats(adminId, 'admin');
    const { employees } = await getEmployees(adminId);
    const statsPromises = employees.map(emp => getUserStats(emp.id, 'employee'));
    const employeeStats = await Promise.all(statsPromises);

    const users: TeamStatsUser[] = [
      { id: admin.id, name: admin.name || admin.username || 'الأدمن', userType: 'admin', stats: adminStats },
      ...employees.map((emp, i) => ({
        id: emp.id,
        name: emp.name || `موظف ${emp.id.slice(-4)}`,
        userType: 'employee' as const,
        stats: employeeStats[i],
      })),
    ];

    const cachedAt = new Date().toISOString();
    await updateAdmin(adminId, {
      adminCachedStats: {
        ...admin.adminCachedStats,
        team: { cachedAt, users },
      },
    });

    return NextResponse.json({ users, cachedAt });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب إحصائيات الفريق', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
