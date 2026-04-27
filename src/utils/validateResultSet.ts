import type { QueryResult } from 'pg';

const oversizedResultSet = GetConvarInt('pg_resultset_warning', 10000);

export default function (invokingResource: string, query: string, result: QueryResult<any> | any) {
  const rows = result && typeof result === 'object' && 'rows' in result ? result.rows : result;
  const length = Array.isArray(rows) ? rows.length : 0;

  if (length < oversizedResultSet) return;

  console.warn(`${invokingResource} executed a query with an oversized result set (${length} results)!\n${query}`);
}
