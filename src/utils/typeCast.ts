import { types } from 'pg';

export function registerTypeParsers() {
  types.setTypeParser(types.builtins.TIMESTAMP, (val) =>
    val ? new Date(val).getTime() : null
  );
  types.setTypeParser(types.builtins.TIMESTAMPTZ, (val) =>
    val ? new Date(val).getTime() : null
  );
  types.setTypeParser(types.builtins.DATE, (val) =>
    val ? new Date(val + ' 00:00:00').getTime() : null
  );
  types.setTypeParser(types.builtins.INT8, (val) =>
    val !== null ? parseInt(val, 10) : null
  );
  types.setTypeParser(types.builtins.NUMERIC, (val) =>
    val !== null ? parseFloat(val) : null
  );
}
