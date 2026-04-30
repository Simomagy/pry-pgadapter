import type { CFXCallback, CFXParameters, TransactionQuery } from './types';
import { rawQuery, rawExecute, rawTransaction, pool } from './database';
import { startTransaction } from 'database/startTransaction';
import { sleep } from 'utils/sleep';
import ghmatti from './compatibility/ghmattimysql';
import mysqlAsync from './compatibility/mysql-async';
import('./update');

const PG = {} as Record<string, Function>;

PG.isReady = () => {
  return pool ? true : false;
};

PG.awaitConnection = async () => {
  while (!pool) await sleep(0);

  return true;
};

PG.query = (
  query: string,
  parameters: CFXParameters,
  cb: CFXCallback,
  invokingResource = GetInvokingResource(),
  isPromise?: boolean
) => {
  rawQuery(null, invokingResource, query, parameters, cb, isPromise);
};

PG.single = (
  query: string,
  parameters: CFXParameters,
  cb: CFXCallback,
  invokingResource = GetInvokingResource(),
  isPromise?: boolean
) => {
  rawQuery('single', invokingResource, query, parameters, cb, isPromise);
};

PG.scalar = (
  query: string,
  parameters: CFXParameters,
  cb: CFXCallback,
  invokingResource = GetInvokingResource(),
  isPromise?: boolean
) => {
  rawQuery('scalar', invokingResource, query, parameters, cb, isPromise);
};

PG.update = (
  query: string,
  parameters: CFXParameters,
  cb: CFXCallback,
  invokingResource = GetInvokingResource(),
  isPromise?: boolean
) => {
  rawQuery('update', invokingResource, query, parameters, cb, isPromise);
};

PG.insert = (
  query: string,
  parameters: CFXParameters,
  cb: CFXCallback,
  invokingResource = GetInvokingResource(),
  isPromise?: boolean
) => {
  rawQuery('insert', invokingResource, query, parameters, cb, isPromise);
};

PG.transaction = (
  queries: TransactionQuery,
  parameters: CFXParameters,
  cb: CFXCallback,
  invokingResource = GetInvokingResource(),
  isPromise?: boolean
) => {
  rawTransaction(invokingResource, queries, parameters, cb, isPromise);
};

PG.startTransaction = (
  transactions: () => Promise<boolean>,
  invokingResource = GetInvokingResource()
) => {
  console.warn(`PG.startTransaction is "experimental" and may receive breaking changes.`)
  return startTransaction(invokingResource, transactions, undefined, true);
};

PG.prepare = (
  query: string,
  parameters: CFXParameters,
  cb: CFXCallback,
  invokingResource = GetInvokingResource(),
  isPromise?: boolean
) => {
  rawExecute(invokingResource, query, parameters, cb, isPromise, true);
};

PG.rawExecute = (
  query: string,
  parameters: CFXParameters,
  cb: CFXCallback,
  invokingResource = GetInvokingResource(),
  isPromise?: boolean
) => {
  rawExecute(invokingResource, query, parameters, cb, isPromise);
};

// provide the store export for compatibility (ghmatti/PG-async); simply returns the query as-is
PG.store = (query: string, cb: Function) => {
  cb(query);
};

// deprecated export names
PG.execute = PG.query;
PG.fetch = PG.query;

function provide(resourceName: string, method: string, cb: Function) {
  on(`__cfx_export_${resourceName}_${method}`, (setCb: Function) => setCb(cb));
}

const NO_ASYNC_WRAP = new Set(['isReady', 'awaitConnection', 'startTransaction', 'store']);

for (const key in PG) {
  const exp = PG[key];

  global.exports(key, exp);

  if (NO_ASYNC_WRAP.has(key)) continue;

  const async_exp = (query: string, parameters: CFXParameters, invokingResource = GetInvokingResource()) => {
    return new Promise((resolve, reject) => {
      PG[key](
        query,
        parameters,
        (result: unknown, err: string) => {
          if (err) return reject(new Error(err));
          resolve(result);
        },
        invokingResource,
        true
      );
    });
  };

  // async_retval
  global.exports(`${key}_async`, async_exp);
  // deprecated aliases for async_retval
  global.exports(`${key}Sync`, async_exp);

  let alias = (ghmatti as any)[key];

  if (alias) {
    provide('ghmattiPG', alias, exp);
    provide('ghmattiPG', `${alias}Sync`, async_exp);
  }

  alias = (mysqlAsync as any)[key];

  if (alias) {
    provide('mysql-async', alias, exp);
  }
}
