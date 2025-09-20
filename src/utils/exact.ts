/**
 * HERA TypeScript Safety Utilities
 * 
 * These utilities provide compile-time safety for prop interfaces,
 * preventing the prop drift issues that can occur when component
 * interfaces evolve but usage sites don't get updated.
 */

/**
 * Exact type utility that prevents excess properties from being passed.
 * This is critical for catching prop name drift at compile time.
 * 
 * @example
 * ```typescript
 * type Props = { name: string; age: number };
 * const props = exact<Props>()({
 *   name: "John",
 *   age: 30,
 *   // invalid: "extra" // ❌ This will cause a compile error
 * });
 * ```
 */
export type Exact<T, X extends T> = T & Record<Exclude<keyof X, keyof T>, never>;

/**
 * Creates an exact function that enforces exact type matching.
 * Use this whenever you pass props or config literals to prevent drift.
 * 
 * @returns A function that enforces exact type matching
 */
export const exact = <T>() => <X extends T>(x: Exact<T, X>): T => x;

/**
 * Brand utility for creating nominal types that prevent ID confusion.
 * This ensures you can't accidentally pass a userId where an organizationId is expected.
 * 
 * @example
 * ```typescript
 * type UserId = Brand<string, "UserId">;
 * type OrganizationId = Brand<string, "OrganizationId">;
 * 
 * function getUser(id: UserId): Promise<User> { ... }
 * function getOrg(id: OrganizationId): Promise<Organization> { ... }
 * 
 * const userId = "user-123" as UserId;
 * const orgId = "org-456" as OrganizationId;
 * 
 * getUser(orgId); // ❌ Compile error - can't pass OrganizationId to function expecting UserId
 * ```
 */
export type Brand<K, T extends string> = K & { readonly __brand: T };

/**
 * Creates a branded type from a regular value.
 * Use this for creating nominal types from primitives.
 */
export const brand = <T extends string>(value: string): Brand<string, T> => 
  value as Brand<string, T>;

/**
 * Utility to ensure exhaustive checking in switch statements.
 * This prevents bugs when new enum values are added but not handled.
 * 
 * @example
 * ```typescript
 * type Status = "pending" | "approved" | "rejected";
 * 
 * function handleStatus(status: Status): string {
 *   switch (status) {
 *     case "pending": return "⏳ Pending";
 *     case "approved": return "✅ Approved";
 *     case "rejected": return "❌ Rejected";
 *     default: return assertNever(status); // ❌ Compile error if new status is added
 *   }
 * }
 * ```
 */
export const assertNever = (x: never): never => {
  throw new Error(`Unexpected value: ${String(x)}`);
};

/**
 * Type-safe Object.keys that preserves the key types.
 * Standard Object.keys returns string[], this returns (keyof T)[].
 */
export const typedKeys = <T extends Record<string, unknown>>(obj: T): (keyof T)[] =>
  Object.keys(obj) as (keyof T)[];

/**
 * Type-safe Object.entries that preserves both key and value types.
 */
export const typedEntries = <T extends Record<string, unknown>>(
  obj: T
): [keyof T, T[keyof T]][] => Object.entries(obj) as [keyof T, T[keyof T]][];

/**
 * Ensures a value is defined (not null or undefined).
 * Use this for runtime assertion of non-null values.
 */
export const assertDefined = <T>(value: T | null | undefined, message?: string): T => {
  if (value === null || value === undefined) {
    throw new Error(message ?? "Value is null or undefined");
  }
  return value;
};

/**
 * Creates a type-safe picker function for selecting specific properties.
 * 
 * @example
 * ```typescript
 * type User = { id: string; name: string; email: string; age: number };
 * const pickUserDisplay = pick<User>()(['name', 'email']);
 * 
 * const user: User = { id: '1', name: 'John', email: 'john@email.com', age: 30 };
 * const display = pickUserDisplay(user); // { name: 'John', email: 'john@email.com' }
 * ```
 */
export const pick = <T>() => 
  <K extends keyof T>(keys: K[]) =>
    (obj: T): Pick<T, K> => {
      const result = {} as Pick<T, K>;
      for (const key of keys) {
        result[key] = obj[key];
      }
      return result;
    };

/**
 * Creates a type-safe omit function for excluding specific properties.
 */
export const omit = <T>() =>
  <K extends keyof T>(keys: K[]) =>
    (obj: T): Omit<T, K> => {
      const result = { ...obj };
      for (const key of keys) {
        delete result[key];
      }
      return result;
    };

/**
 * HERA Smart Code Brand Types
 * These ensure Smart Codes are properly typed and can't be confused.
 */
export type SmartCode = Brand<string, "SmartCode">;
export type EntityId = Brand<string, "EntityId">;
export type OrganizationId = Brand<string, "OrganizationId">;
export type TransactionId = Brand<string, "TransactionId">;

/**
 * Creates a properly typed Smart Code.
 */
export const createSmartCode = (code: string): SmartCode => {
  // Validate Smart Code format: HERA.{DOMAIN}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}
  const smartCodePattern = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/;
  if (!smartCodePattern.test(code)) {
    throw new Error(`Invalid Smart Code format: ${code}. Expected: HERA.{DOMAIN}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}`);
  }
  return code as SmartCode;
};

/**
 * Component props utility that ensures exact prop matching.
 * Use this to get exact props from component types.
 * 
 * @example
 * ```typescript
 * import type { ComponentProps } from 'react';
 * 
 * type ButtonProps = ExactComponentProps<typeof Button>;
 * ```
 */
export type ExactComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

/**
 * Creates a discriminated union helper for type-safe state management.
 * 
 * @example
 * ```typescript
 * type LoadingState = DiscriminatedUnion<{
 *   idle: {};
 *   loading: { progress: number };
 *   success: { data: string };
 *   error: { message: string };
 * }>;
 * 
 * const state: LoadingState = { type: 'loading', progress: 50 };
 * ```
 */
export type DiscriminatedUnion<T extends Record<string, any>> = {
  [K in keyof T]: { type: K } & T[K];
}[keyof T];