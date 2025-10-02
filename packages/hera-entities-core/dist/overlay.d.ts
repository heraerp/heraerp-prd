import type { EntityPreset, DynamicField, Role } from './types.js';
export declare function withOverlay<T extends EntityPreset>(base: T, overlay: Partial<T>): T;
export declare function isVisible(field: DynamicField, role: Role, capabilities?: Record<string, boolean>): boolean;
