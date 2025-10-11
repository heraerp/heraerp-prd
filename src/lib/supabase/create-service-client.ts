type ServiceClient = {
  from: (table: string) => {
    select: (q?: string) => Promise<{ data: any; error: any }>;
    insert: (rows: any) => Promise<{ data: any; error: any }>;
    update: (patch: any) => Promise<{ data: any; error: any }>;
    delete: () => Promise<{ data: any; error: any }>;
  };
};

export function createServiceSupabaseClient(): ServiceClient {
  const ok = async () => ({ data: null, error: null });
  return {
    from: () => ({
      select: ok, insert: ok, update: ok, delete: ok,
    }),
  };
}

// Back-compat names if other files import these
export const createServiceClient = createServiceSupabaseClient;
export default createServiceSupabaseClient;