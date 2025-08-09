import { runHealthChecks } from './checks.ts';
import { startHealthScheduler, stopHealthScheduler } from './scheduler.ts';
import { healthRouter } from './routes.ts';

export {
  runHealthChecks,
  startHealthScheduler,
  stopHealthScheduler,
  healthRouter,
};

export type HealthCheckResult = {
  status: 'OK' | 'WARN' | 'FAIL';
  durationMs: number;
  message: string;
  meta: Record<string, any>;
};