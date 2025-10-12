// ❌ Do NOT re-export UI here.
// Only server-safe constants/helpers belong here.
export * from './smart-codes';
export * from './registry';
export * from './categories';
export * from './metadata';

// Provide no-op stubs so server imports don't drag client code.
export const HERA_DNA_INFO = {};
export const HERA_DNA_REGISTRY = {};
export const HERA_DNA_CATEGORIES: string[] = [];
export function getComponentMetadata(_: string) { return null; }
export async function loadDNAComponent(_: string) { return null; }
export function useBottomSheet() { throw new Error('useBottomSheet is client-only'); }