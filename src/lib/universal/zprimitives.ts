// Base Zod primitives. This file must not import from any local module.
import { z } from 'zod';

export const SMART_CODE_REGEX =
  /^HERA\.[A-Z0-9]+(?:\.[A-Z0-9]+){2,}\.v\d+$/i; 
// e.g. HERA.SALON.CRM.ENT.CUST.V1 (at least 4 segments + version)

export const UUID = z.string().uuid();

export const SmartCodeSchema = z.string()
  .regex(SMART_CODE_REGEX, 'Invalid Smart Code (HERA.INDUSTRY.MODULE.TYPE.SUBTYPE.vX)');

export const CurrencySchema = z.object({
  code: z.string().length(3),
});