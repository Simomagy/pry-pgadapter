import type { CFXParameters } from '../types';

function convertNamedToPositional(query: string, parameters: Record<string, any>): [string, any[]] {
  const values: any[] = [];
  const nameToIndex: Record<string, number> = {};

  const converted = query.replace(/[:@]([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, name) => {
    if (!(name in nameToIndex)) {
      nameToIndex[name] = values.length;
      values.push(parameters[name] ?? null);
    }
    return `$${nameToIndex[name] + 1}`;
  });

  return [converted, values];
}

export function convertPositionalPlaceholders(query: string): [string, number] {
  let count = 0;
  const converted = query.replace(/\?\?|\?/g, (match) => {
    if (match === '??') {
      throw new Error(
        `[pry-pgadapter] '??' (MySQL identifier escaping) is not supported in PostgreSQL. Use double-quoted identifiers directly (e.g. "columnName").`
      );
    }
    return `$${++count}`;
  });
  return [converted, count];
}

const MAX_PG_PARAMS = 65535;

/**
 * Transforms a single-row INSERT (with $N placeholders) into a multi-row INSERT
 * by replicating the VALUES tuple for each row in `rows` with offset placeholders.
 * Preserves any trailing clause (e.g. RETURNING).
 * Returns chunks when the total parameter count would exceed MAX_PG_PARAMS.
 */
export function buildMultiRowInsert(
  query: string,
  rows: any[][],
  placeholders: number
): Array<[string, any[]]> {
  const valuesKeyword = ' VALUES ';
  const valuesIdx = query.toUpperCase().lastIndexOf(valuesKeyword);

  if (valuesIdx === -1) {
    throw new Error('[pry-pgadapter] buildMultiRowInsert: missing VALUES clause in INSERT query');
  }

  const prefix = query.substring(0, valuesIdx);

  const afterValues = query.substring(valuesIdx + valuesKeyword.length);
  let depth = 0;
  let tupleEnd = afterValues.length;
  for (let i = 0; i < afterValues.length; i++) {
    if (afterValues[i] === '(') depth++;
    else if (afterValues[i] === ')') {
      if (--depth === 0) { tupleEnd = i + 1; break; }
    }
  }
  const suffix = afterValues.substring(tupleEnd).trim();

  const rowsPerChunk = placeholders > 0 ? Math.floor(MAX_PG_PARAMS / placeholders) : rows.length;
  const chunks: Array<[string, any[]]> = [];

  for (let start = 0; start < rows.length; start += rowsPerChunk) {
    const chunk = rows.slice(start, start + rowsPerChunk);
    const tuples: string[] = [];
    const flatValues: any[] = [];

    for (let r = 0; r < chunk.length; r++) {
      const row = chunk[r];
      const base = r * placeholders;
      tuples.push(
        '(' + Array.from({ length: placeholders }, (_, i) => `$${base + i + 1}`).join(', ') + ')'
      );
      for (let i = 0; i < placeholders; i++) {
        flatValues.push(row[i] ?? null);
      }
    }

    const chunkQuery = `${prefix} VALUES ${tuples.join(', ')}${suffix ? ' ' + suffix : ''}`;
    chunks.push([chunkQuery, flatValues]);
  }

  return chunks;
}

export const parseArguments = (query: string, parameters?: CFXParameters): [string, CFXParameters] => {
  if (typeof query !== 'string')
    throw new Error(`Expected query to be a string but received ${typeof query} instead.`);

  if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
    if (/[:@][a-zA-Z_][a-zA-Z0-9_]*/.test(query)) {
      return convertNamedToPositional(query, parameters);
    }
  }

  if (!parameters || typeof parameters === 'function') parameters = [];

  const [convertedQuery, placeholders] = convertPositionalPlaceholders(query);
  query = convertedQuery;

  if (parameters && !Array.isArray(parameters)) {
    const arr: unknown[] = [];
    for (let i = 0; i < placeholders; i++) {
      arr[i] = parameters[i + 1] ?? null;
    }
    parameters = arr;
  } else {
    if (placeholders) {
      if (parameters.length === 0) {
        for (let i = 0; i < placeholders; i++) parameters[i] = null;
        return [query, parameters];
      }

      const diff = placeholders - parameters.length;

      if (diff > 0) {
        for (let i = 0; i < diff; i++) parameters.push(null);
      } else if (diff < 0) {
        throw new Error(`Expected ${placeholders} parameters, but received ${parameters.length}.`);
      }
    }
  }

  return [query, parameters];
};
