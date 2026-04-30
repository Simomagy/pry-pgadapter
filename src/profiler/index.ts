import type { PG } from 'database';
import type { CFXParameters } from 'types';

export async function runProfiler(_connection: PG, _invokingResource: string): Promise<false> {
  return false;
}

export async function profileBatchStatements(
  _connection: PG,
  _invokingResource: string,
  _query: string | { query: string; params?: CFXParameters }[],
  _parameters: CFXParameters | null,
  _offset: number
): Promise<void> {}
