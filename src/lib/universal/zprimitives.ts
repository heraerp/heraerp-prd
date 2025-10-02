// Base Zod primitives. This file must not import from any local module.
import { z } from 'zod';

// HERA DNA Smart Code Pattern - Per official SMART_CODE_GUIDE.md
// Format: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}
// - 6-10 segments total (HERA + 3-7 middle segments + version)
// - Minimum: HERA + 3 middle segments + version = 6 total
// - Maximum: HERA + 7 middle segments + version = 10 total
// - Uppercase only [A-Z0-9_]
// - Version must be uppercase V followed by digit(s)
// - Examples:
//   * HERA.SALON.POS.CART.ACTIVE.V1 (6 segments - minimum)
//   * HERA.SALON.PROD.CATEGORY.HAIR_SERVICES.V1 (7 segments)
//   * HERA.SALON.POS.ADJUST.DISCOUNT.CART.PCT.V1 (10 segments - maximum)
export const SMART_CODE_REGEX =
  /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,7}\.[Vv][0-9]+$/;

export const UUID = z.string().uuid();

export const SmartCodeSchema = z.string()
  .regex(SMART_CODE_REGEX, 'Invalid Smart Code (must be HERA.INDUSTRY.MODULE.TYPE.SUBTYPE.V1 format)');

export const CurrencySchema = z.object({
  code: z.string().length(3),
});