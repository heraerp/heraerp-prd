export type SQL = string;
export type QueryParams = any[] | Record<string, any>;
export type QueryResult<T=any> = { rows: T[] };

export async function executeQuery<T=any>(_sql: SQL, _params?: QueryParams): Promise<QueryResult<T>> {
  // Replace with your real DB call; this keeps build happy.
  return { rows: [] };
}