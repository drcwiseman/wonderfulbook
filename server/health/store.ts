import { db } from '../db.js';
import { healthCheckRuns, healthCheckItems, type HealthCheckRun, type HealthCheckItem } from '../../shared/schema.js';
import { sql, eq, desc, count } from 'drizzle-orm';

export async function getLatestHealthRun(): Promise<(HealthCheckRun & { items: HealthCheckItem[] }) | null> {
  try {
    const [run] = await db.select()
      .from(healthCheckRuns)
      .orderBy(desc(healthCheckRuns.startedAt))
      .limit(1);

    if (!run) {
      return null;
    }

    const items = await db.select()
      .from(healthCheckItems)
      .where(eq(healthCheckItems.runId, run.id));

    return { ...run, items };
  } catch (error) {
    console.error('Error fetching latest health run:', error);
    return null;
  }
}

export async function getHealthRunById(runId: string): Promise<(HealthCheckRun & { items: HealthCheckItem[] }) | null> {
  try {
    const [run] = await db.select()
      .from(healthCheckRuns)
      .where(eq(healthCheckRuns.id, runId));

    if (!run) {
      return null;
    }

    const items = await db.select()
      .from(healthCheckItems)
      .where(eq(healthCheckItems.runId, run.id));

    return { ...run, items };
  } catch (error) {
    console.error('Error fetching health run:', error);
    return null;
  }
}

export async function getHealthRunHistory(
  page: number = 1, 
  limit: number = 20
): Promise<{ runs: HealthCheckRun[]; total: number; totalPages: number }> {
  try {
    const offset = (page - 1) * limit;

    const runs = await db.select()
      .from(healthCheckRuns)
      .orderBy(desc(healthCheckRuns.startedAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db.select({ count: count() })
      .from(healthCheckRuns);

    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    return { runs, total, totalPages };
  } catch (error) {
    console.error('Error fetching health run history:', error);
    return { runs: [], total: 0, totalPages: 0 };
  }
}

export async function getHealthStats(days: number = 7): Promise<{
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  componentStats: Array<{
    name: string;
    successRate: number;
    averageDuration: number;
    totalChecks: number;
  }>;
  statusHistory: Array<{
    date: string;
    ok: number;
    warn: number;
    fail: number;
  }>;
}> {
  try {
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get total runs and success rate
    const runStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_runs,
        AVG(EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000) as avg_duration,
        COUNT(CASE WHEN overall_status = 'OK' THEN 1 END) * 100.0 / COUNT(*) as success_rate
      FROM health_check_runs 
      WHERE started_at >= ${daysAgo}
    `);

    // Get component stats
    const componentStats = await db.execute(sql`
      SELECT 
        hci.name,
        COUNT(*) as total_checks,
        COUNT(CASE WHEN hci.status = 'OK' THEN 1 END) * 100.0 / COUNT(*) as success_rate,
        AVG(hci.duration_ms) as avg_duration
      FROM health_check_items hci
      JOIN health_check_runs hcr ON hci.run_id = hcr.id
      WHERE hcr.started_at >= ${daysAgo}
      GROUP BY hci.name
      ORDER BY hci.name
    `);

    // Get daily status history
    const statusHistory = await db.execute(sql`
      SELECT 
        DATE(started_at) as date,
        COUNT(CASE WHEN overall_status = 'OK' THEN 1 END) as ok,
        COUNT(CASE WHEN overall_status = 'WARN' THEN 1 END) as warn,
        COUNT(CASE WHEN overall_status = 'FAIL' THEN 1 END) as fail
      FROM health_check_runs
      WHERE started_at >= ${daysAgo}
      GROUP BY DATE(started_at)
      ORDER BY DATE(started_at)
    `);

    const stats = runStats.rows[0] as any;
    
    return {
      totalRuns: parseInt(stats?.total_runs || '0'),
      successRate: parseFloat(stats?.success_rate || '0'),
      averageDuration: parseFloat(stats?.avg_duration || '0'),
      componentStats: (componentStats.rows as any[]).map(row => ({
        name: row.name,
        successRate: parseFloat(row.success_rate || '0'),
        averageDuration: parseFloat(row.avg_duration || '0'),
        totalChecks: parseInt(row.total_checks || '0'),
      })),
      statusHistory: (statusHistory.rows as any[]).map(row => ({
        date: row.date,
        ok: parseInt(row.ok || '0'),
        warn: parseInt(row.warn || '0'),
        fail: parseInt(row.fail || '0'),
      })),
    };
  } catch (error) {
    console.error('Error fetching health stats:', error);
    return {
      totalRuns: 0,
      successRate: 0,
      averageDuration: 0,
      componentStats: [],
      statusHistory: [],
    };
  }
}

export async function cleanupOldHealthRuns(daysToKeep: number = 30): Promise<{ deletedRuns: number }> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await db.delete(healthCheckRuns)
      .where(sql`started_at < ${cutoffDate}`)
      .returning({ id: healthCheckRuns.id });

    return { deletedRuns: result.length };
  } catch (error) {
    console.error('Error cleaning up old health runs:', error);
    return { deletedRuns: 0 };
  }
}