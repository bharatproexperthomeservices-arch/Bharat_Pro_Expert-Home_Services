export type HealthStatus = 'ok' | 'degraded' | 'down';
export interface ApiHealth { status: HealthStatus; service: string; businessName: string; timestamp: string; }
