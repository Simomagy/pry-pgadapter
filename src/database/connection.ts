import type { PoolClient } from 'pg';
import { scheduleTick } from '../utils/scheduleTick';
import { sleep } from '../utils/sleep';
import { pool } from './pool';
import { pg_transaction_isolation_level } from '../config';
import type { CFXParameters } from 'types';

(Symbol as any).asyncDispose ??= Symbol('Symbol.asyncDispose');

let connectionCounter = 0;
const activeConnections: Record<number, MySql> = {};

function hashQuery(query: string): string {
  let hash = 5381;
  for (let i = 0; i < query.length; i++) {
    hash = (((hash << 5) + hash) + query.charCodeAt(i)) | 0;
  }
  return `ps_${(hash >>> 0).toString(16)}`;
}

export class MySql {
  id: number;
  connection: PoolClient;
  transaction?: boolean;

  constructor(connection: PoolClient) {
    this.id = ++connectionCounter;
    this.connection = connection;
    activeConnections[this.id] = this;
  }

  async query(query: string, values: CFXParameters = []) {
    scheduleTick();
    return await this.connection.query({ text: query, values });
  }

  async execute(query: string, values: CFXParameters = []) {
    scheduleTick();
    return await this.connection.query({
      name: hashQuery(query),
      text: query,
      values: values ?? [],
    });
  }

  async beginTransaction() {
    this.transaction = true;
    await this.connection.query('BEGIN');
    await this.connection.query(pg_transaction_isolation_level);
  }

  async rollback() {
    delete this.transaction;
    return await this.connection.query('ROLLBACK');
  }

  async commit() {
    delete this.transaction;
    return await this.connection.query('COMMIT');
  }

  async [Symbol.asyncDispose]() {
    if (this.transaction) {
      await this.commit().catch((err) =>
        console.error(`[pry-pgadapter] Error during implicit commit in dispose: ${err.message}`)
      );
    }
    delete activeConnections[this.id];
    this.connection.release();
  }
}

export async function getConnection(connectionId?: number) {
  while (!pool) await sleep(0);

  return connectionId
    ? activeConnections[connectionId]
    : new MySql(await pool.connect());
}
