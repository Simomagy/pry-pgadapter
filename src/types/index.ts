import type { QueryResult } from 'pg';

export type QueryResponse = QueryResult<any>;

export type QueryType = 'execute' | 'insert' | 'update' | 'scalar' | 'single' | null;
// null = query generica (SELECT senza tipo specifico), restituisce array di righe

export type TransactionQuery = {
  query: string | string[];
  parameters?: CFXParameters;
  values?: CFXParameters;
};

export type CFXParameters = any[];

export type CFXCallback = (result: unknown, err?: string) => void;
