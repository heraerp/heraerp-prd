export const flags = {
  ENABLE_FINANCE_POSTING:
    (process.env.NEXT_PUBLIC_ENABLE_FINANCE_POSTING ?? 'true').toLowerCase() !== 'false',
};