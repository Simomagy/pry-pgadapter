import { logError, logQuery } from '../logger';
import { CFXCallback, CFXParameters, QueryType } from '../types';
import { parseResponse } from '../utils/parseResponse';
import { executeType, parseExecute } from '../utils/parseExecute';
import { buildMultiRowInsert, convertPositionalPlaceholders } from '../utils/parseArguments';
import { getConnection } from './connection';
import { setCallback } from '../utils/setCallback';
import { performance } from 'perf_hooks';
import validateResultSet from 'utils/validateResultSet';

export const rawExecute = async (
  invokingResource: string,
  query: string,
  parameters: CFXParameters,
  cb?: CFXCallback,
  isPromise?: boolean,
  unpack?: boolean,
  connectionId?: number
) => {
  cb = setCallback(parameters, cb);

  let type: QueryType;
  let placeholders: number;
  let pgQuery: string;

  try {
    type = executeType(query);
    const placeholderCount = (query.match(/\?(?!\?)/g) ?? []).length;
    [pgQuery, placeholders] = convertPositionalPlaceholders(query);
    parameters = parseExecute(placeholderCount, parameters);
  } catch (err: any) {
    return logError(invokingResource, cb, isPromise, err, query, parameters);
  }

  await using connection = await getConnection(connectionId);

  if (!connection) return;

  const fireCallback = (value: unknown) => {
    if (!cb) return;
    try {
      cb(value);
    } catch (err) {
      if (typeof err === 'string') {
        if (err.includes('SCRIPT ERROR:')) return console.log(err);
        console.log(`^1SCRIPT ERROR in invoking resource ${invokingResource}: ${err}^0`);
      }
    }
  };

  try {
    const parametersLength = parameters.length == 0 ? 1 : parameters.length;

    // Multi-row INSERT: collapse N individual executions into one (or few) chunked queries.
    if (type === 'insert' && parametersLength > 1) {
      const chunks = buildMultiRowInsert(pgQuery, parameters as any[][], placeholders);
      let totalRowCount = 0;
      let lastResult: any;

      for (const [chunkQuery, flatValues] of chunks) {
        const startTime = performance.now();
        const result = await connection.query(chunkQuery, flatValues);
        totalRowCount += result.rowCount ?? 0;
        lastResult = result;
        logQuery(invokingResource, chunkQuery, performance.now() - startTime, flatValues);
        validateResultSet(invokingResource, chunkQuery, result);
      }

      // If RETURNING was present, return parsed rows from the last chunk;
      // otherwise return the total number of inserted rows.
      const parsed = unpack
        ? (lastResult.rows?.length ? parseResponse(type, lastResult) : totalRowCount)
        : lastResult;

      if (!cb) return parsed;
      fireCallback(parsed);
      return;
    }

    // Single-row or non-INSERT: use named prepared statements (server-side caching).
    const response = [] as any[];

    for (let index = 0; index < parametersLength; index++) {
      const values = parameters[index];

      if (values && placeholders > values.length) {
        for (let i = values.length; i < placeholders; i++) {
          values[i] = null;
        }
      }

      const startTime = performance.now();
      const result = await connection.execute(pgQuery, values);

      response.push(unpack ? parseResponse(type, result) : result);

      logQuery(invokingResource, pgQuery, performance.now() - startTime, values);
      validateResultSet(invokingResource, pgQuery, result);
    }

    if (!cb) return response.length === 1 ? response[0] : response;

    if (response.length === 1) {
      if (unpack && type === null) {
        const rows = response[0];
        if (rows[0] && Object.keys(rows[0]).length === 1) {
          fireCallback(Object.values(rows[0])[0]);
        } else fireCallback(rows[0]);
      } else {
        fireCallback(response[0]);
      }
    } else {
      fireCallback(response);
    }
  } catch (err: any) {
    logError(invokingResource, cb, isPromise, err, pgQuery!, parameters);
  }
};
