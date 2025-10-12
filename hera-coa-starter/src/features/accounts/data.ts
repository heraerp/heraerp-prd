export type AccountNode = {
  id: string;
  parentId?: string | null;
  title: string;
  number: string;
  depth: number;
  normalBalance: "Dr" | "Cr";
  status: "Active" | "Archived";
};

export function useCoaTree() {
  // TODO: fetch tree from API
  return { data: [] as AccountNode[], isLoading: false };
}

export function useAccountCRUD() {
  return {
    create: async (_input: Partial<AccountNode>) => {/* call API */},
    update: async (_id: string, _patch: Partial<AccountNode>) => {/* call API */},
    archive: async (_id: string) => {/* call API */},
    restore: async (_id: string) => {/* call API */},
  };
}
