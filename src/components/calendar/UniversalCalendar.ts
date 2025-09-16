/**
 * HERA Universal Calendar Export
 *
 * This is the standard calendar component for all HERA modules.
 * The HeraDnaUniversalResourceCalendar is our Teams-inspired
 * multi-resource calendar that adapts to any business type.
 *
 * @example
 * // Import the universal calendar
 * import { UniversalCalendar } from '@/src/components/calendar/UniversalCalendar'
 *
 * // Use for salon
 * <UniversalCalendar
 *   businessType="salon"
 *   resourceType="stylist"
 *   appointmentType="service"
 * />
 *
 * // Use for healthcare
 * <UniversalCalendar
 *   businessType="healthcare"
 *   resourceType="doctor"
 *   appointmentType="consultation"
 * />
 */

export { HeraDnaUniversalResourceCalendar as UniversalCalendar } from './HeraDnaUniversalResourceCalendar'
export type { HeraDnaUniversalResourceCalendarProps as UniversalCalendarProps } from './HeraDnaUniversalResourceCalendar'

// Re-export with clear naming for different use cases
export { HeraDnaUniversalResourceCalendar as TeamsCalendar } from './HeraDnaUniversalResourceCalendar'
export { HeraDnaUniversalResourceCalendar as ResourceCalendar } from './HeraDnaUniversalResourceCalendar'
export { HeraDnaUniversalResourceCalendar as HERACalendar } from './HeraDnaUniversalResourceCalendar'

// Default export
export { HeraDnaUniversalResourceCalendar as default } from './HeraDnaUniversalResourceCalendar'
