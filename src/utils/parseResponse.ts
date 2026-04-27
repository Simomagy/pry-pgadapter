import type { QueryResult } from 'pg';
import type { QueryType } from '../types';

export const parseResponse = (type: QueryType, result: QueryResult<any>): any => {
  switch (type) {
    case 'insert': {
      const row = result.rows?.[0];
      if (!row) return null;
      return row.id ?? Object.values(row)[0] ?? null;
    }

    case 'update':
      return result.rowCount ?? null;

    case 'single':
      return result.rows?.[0] ?? null;

    case 'scalar': {
      const row = result.rows?.[0];
      return (row && Object.values(row)[0]) ?? null;
    }

    default:
      return result.rows ?? null;
  }
};
