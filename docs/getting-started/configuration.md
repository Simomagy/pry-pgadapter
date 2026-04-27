# Configuration

All configuration is done via **convars** in `server.cfg`. Set them before the `ensure pry-pgadapter` line.

---

## Connection String

### `pg_connection_string` _(required)_

The PostgreSQL connection string. Two formats are accepted:

**URI format** (recommended):

```
set pg_connection_string "postgresql://username:password@host:5432/database"
```

The following URI schemes are accepted and normalized internally:

| Scheme | Resolved as |
|---|---|
| `postgresql://` | native |
| `postgres://` | normalized to `postgresql://` |
| `mysql://` | normalized to `postgresql://` |

**Key-value format** (semicolon-separated):

```
set pg_connection_string "host=localhost;user=postgres;password=secret;database=mydb;port=5432"
```

The following key aliases are recognized:

| Alias | Resolved key |
|---|---|
| `hostname`, `ip`, `server`, `addr`, `address` | `host` |
| `user id`, `username`, `uid` | `user` |
| `pwd`, `pass` | `password` |
| `db` | `database` |

> **Note:** `multipleStatements` is not supported by PostgreSQL and will be silently ignored with a warning.

**SSL** can be passed as a JSON string in the connection string:

```
set pg_connection_string "postgresql://user:pass@host/db?ssl={\"rejectUnauthorized\":false}"
```

---

## Debug & Logging

### `pg_debug` _(default: `false`)_

Controls query debug logging. Accepts three forms:

| Value | Behavior |
|---|---|
| `false` | No debug output |
| `true` | Log all queries from all resources |
| `'["res-a","res-b"]'` | Log only queries from the listed resources |

```
set pg_debug true
set pg_debug "[\"my-resource\",\"another-resource\"]"
```

> Can also be toggled at runtime with the `pgadapter_debug` server command (see [Debug & Profiling](../advanced/debug.md)).

### `pg_slow_query_warning` _(default: `200`)_

Execution time threshold in milliseconds. Any query that takes longer will be logged to the console, regardless of the `pg_debug` setting.

```
set pg_slow_query_warning 500
```

### `pg_log_size` _(default: `100`, `10000` when debug is enabled)_

Maximum number of query log entries stored **per resource** for the in-game UI dashboard. Older entries are dropped when the limit is reached.

```
set pg_log_size 200
```

---

## UI Dashboard

### `pg_ui` _(default: `false`)_

Enable the in-game query profiler UI. When enabled, every executed query is recorded and can be inspected via the `pgadapter` command.

```
set pg_ui true
```

See [UI Dashboard](../advanced/ui.md) for usage details.

---

## Transactions

### `pg_transaction_isolation_level` _(default: `2`)_

Sets the PostgreSQL transaction isolation level used by `PG.transaction` and `PG.startTransaction`.

| Value | Level |
|---|---|
| `1` | `REPEATABLE READ` |
| `2` | `READ COMMITTED` _(default)_ |
| `3` | `READ UNCOMMITTED` _(not native to PG; treated as `READ COMMITTED` with a warning)_ |
| `4` | `SERIALIZABLE` |

```
set pg_transaction_isolation_level 1
```

---

## External Logger

### `pg_logger_service` _(default: empty)_

Path to a JavaScript logger module. Two formats are supported:

**Built-in logger** (relative to the resource):

```
set pg_logger_service "fivemanage"
```

This loads `logger/fivemanage.js` from within the pry-pgadapter resource directory.

**External resource logger**:

```
set pg_logger_service "@my-logger-resource/logger/custom"
```

The `@` prefix indicates a different resource. The path after the first `/` is the file path within that resource.

---

## Per-resource Options

Individual resources can set options via `fxmanifest.lua` metadata:

```lua
-- fxmanifest.lua
pg_option 'return_callback_errors'
```

| Option | Effect |
|---|---|
| `return_callback_errors` | Errors are passed as the second argument to callbacks instead of throwing |
