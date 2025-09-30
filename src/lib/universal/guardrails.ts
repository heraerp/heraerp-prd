import { z } from 'zod';

export const UUID = z.string().uuid();
export const SmartCode = z
  .string()
  .regex(/^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/);

export const requireOrg = (org?: string) => {
  if (!org) throw new Error('organization_id is required');
};

export const guardSmartCode = (code?: string) => {
  if (!code) throw new Error('smart_code is required');
  if (!SmartCode.safeParse(code).success) throw new Error('smart_code pattern invalid');
};