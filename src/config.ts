import type { PoolConfig } from 'pg';

export const pg_connection_string = GetConvar('pg_connection_string', '');
export let pg_ui = GetConvar('pg_ui', 'false') === 'true';
export let pg_slow_query_warning = GetConvarInt('pg_slow_query_warning', 200);
export let pg_debug: boolean | string[] = false;

export let pg_log_size = 0;

export function setDebug() {
  pg_ui = GetConvar('pg_ui', 'false') === 'true';
  pg_slow_query_warning = GetConvarInt('pg_slow_query_warning', 200);

  try {
    const debug = GetConvar('pg_debug', 'false');
    pg_debug = debug === 'false' ? false : JSON.parse(debug);
  } catch (e) {
    pg_debug = true;
  }

  pg_log_size = pg_debug ? 10000 : GetConvarInt('pg_log_size', 100);
}

export const pg_transaction_isolation_level = (() => {
  const level = GetConvarInt('pg_transaction_isolation_level', 2);
  const query = 'SET TRANSACTION ISOLATION LEVEL';

  switch (level) {
    case 1:
      return `${query} REPEATABLE READ`;
    case 2:
      return `${query} READ COMMITTED`;
    case 3:
      console.warn(
        `^3[pry-pgadapter] READ UNCOMMITTED is not supported by PostgreSQL and will be treated as READ COMMITTED.^0`
      );
      return `${query} READ COMMITTED`;
    case 4:
      return `${query} SERIALIZABLE`;
    default:
      return `${query} READ COMMITTED`;
  }
})();

function parseUri(connectionString: string): Record<string, any> {
  const normalized = connectionString
    .replace(/^mysql:\/\//, 'postgresql://')
    .replace(/^postgres:\/\//, 'postgresql://');

  const splitMatchGroups = normalized.match(
    new RegExp(
      '^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([\\w\\d\\-\\u0100-\\uffff.%]*)(?::([0-9]+))?)?([^?#]+)?(?:\\?([^#]*))?$'
    )
  ) as RegExpMatchArray;

  if (!splitMatchGroups)
    throw new Error(`pg_connection_string structure was invalid (${connectionString})`);

  const authTarget = splitMatchGroups[2] ? splitMatchGroups[2].split(':') : [];

  const options: Record<string, any> = {
    user: authTarget[0] || undefined,
    password: authTarget[1] || undefined,
    host: splitMatchGroups[3],
    port: parseInt(splitMatchGroups[4]) || 5432,
    database: splitMatchGroups[5]?.replace(/^\/+/, ''),
    ...(splitMatchGroups[6] &&
      splitMatchGroups[6].split('&').reduce<Record<string, string>>((connectionInfo, parameter) => {
        const [key, value] = parameter.split('=');
        connectionInfo[key] = value;
        return connectionInfo;
      }, {})),
  };

  return options;
}

export function getConnectionOptions(): PoolConfig {
  const raw = pg_connection_string;
  const isUri = /^(?:mysql|postgres(?:ql)?):\/\//.test(raw);

  const options: Record<string, any> = isUri
    ? parseUri(raw)
    : raw
        .replace(/(?:host(?:name)|ip|server|data\s?source|addr(?:ess)?)=/gi, 'host=')
        .replace(/(?:user\s?(?:id|name)?|uid)=/gi, 'user=')
        .replace(/(?:pwd|pass)=/gi, 'password=')
        .replace(/(?:db)=/gi, 'database=')
        .split(';')
        .reduce<Record<string, string>>((connectionInfo, parameter) => {
          const [key, value] = parameter.split('=');
          if (key) connectionInfo[key] = value;
          return connectionInfo;
        }, {});

  if (options.multipleStatements) {
    console.warn(
      `^3[pry-pgadapter] multipleStatements is not supported by PostgreSQL and will be ignored.^0`
    );
    delete options.multipleStatements;
  }

  if (typeof options.ssl === 'string') {
    try {
      options.ssl = JSON.parse(options.ssl);
    } catch (err) {
      console.log(`^3[pry-pgadapter] Failed to parse ssl property in configuration (${err})!^0`);
    }
  }

  return {
    connectionTimeoutMillis: 60000,
    ...options,
  } as PoolConfig;
}

RegisterCommand(
  'pgadapter_debug',
  (source: number, args: string[]) => {
    if (source !== 0) return console.log('^3This command can only be run server side^0');
    switch (args[0]) {
      case 'add':
        if (!Array.isArray(pg_debug)) pg_debug = [];
        pg_debug.push(args[1]);
        SetConvar('pg_debug', JSON.stringify(pg_debug));
        return console.log(`^3Added ${args[1]} to pg_debug^0`);

      case 'remove':
        if (Array.isArray(pg_debug)) {
          const index = pg_debug.indexOf(args[1]);
          if (index === -1) return;
          pg_debug.splice(index, 1);
          if (pg_debug.length === 0) pg_debug = false;
          SetConvar('pg_debug', JSON.stringify(pg_debug) || 'false');
          return console.log(`^3Removed ${args[1]} from pg_debug^0`);
        }

      default:
        return console.log(`^3Usage: pgadapter_debug add|remove <resource>^0`);
    }
  },
  true
);
