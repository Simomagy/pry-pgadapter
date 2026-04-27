import { getConnectionOptions } from 'config';
import { Pool } from 'pg';
import { registerTypeParsers } from 'utils/typeCast';

export let pool: Pool;
export let dbVersion = '';

export async function createConnectionPool() {
  registerTypeParsers();

  const config = getConnectionOptions();

  try {
    const dbPool = new Pool(config);

    const result = await dbPool.query('SELECT VERSION() as version');
    dbVersion = `^5[${result.rows[0].version}]`;

    console.log(`${dbVersion} ^2Database server connection established!^0`);

    pool = dbPool;
  } catch (err: any) {
    console.log(
      `^3Unable to establish a connection to the database (${err.code})!\n^1Error${
        err.errno ? ` ${err.errno}` : ''
      }: ${err.message}^0`
    );

    console.log(`^3Check pg_connection_string in your server.cfg and ensure PostgreSQL is reachable.^0`);

    if (config.password) (config as any).password = '******';

    console.log(config);
  }
}
