# Compatibility — mysql-async & ghmattimysql

pry-pgadapter provides drop-in compatibility with two widely-used MySQL abstraction libraries for FiveM: **mysql-async** and **ghmattimysql**. This allows you to use pry-pgadapter as a PostgreSQL backend for resources originally written for MySQL, with little or no code changes.

---

## How It Works

The `fxmanifest.lua` declares:

```lua
provide 'mysql-async'
provide 'ghmattimysql'
```

This registers pry-pgadapter as the provider for both resource names. FiveM's export resolution routes calls to `exports['mysql-async']:fetchAll(...)` and `exports['ghmattimysql']:execute(...)` directly to pry-pgadapter's handlers.

---

## mysql-async Export Mapping

| mysql-async export | pry-pgadapter method |
|---|---|
| `mysql_fetch_all` | `query` |
| `mysql_fetch_scalar` | `scalar` |
| `mysql_execute` | `update` |
| `mysql_insert` | `insert` |
| `mysql_transaction` | `transaction` |
| `mysql_store` | `store` |

**Example — mysql-async resource (no changes needed):**

```lua
-- Original mysql-async usage
exports['mysql-async']:mysql_fetch_all('SELECT * FROM players', {}, function(result)
    print(#result)
end)
```

This call is transparently forwarded to `PG.query`.

---

## ghmattimysql Export Mapping

| ghmattimysql export | pry-pgadapter method |
|---|---|
| `execute` | `query` |
| `scalar` | `scalar` |
| `transaction` | `transaction` |
| `store` | `store` |

Sync variants are also available:

| ghmattimysql sync export | pry-pgadapter method |
|---|---|
| `executeSync` | `query` (promise) |
| `scalarSync` | `scalar` (promise) |

**Example — ghmattimysql resource (no changes needed):**

```lua
exports['ghmattimysql']:execute('SELECT * FROM players', {}, function(result)
    for _, row in ipairs(result) do
        print(row.name)
    end
end)
```

---

## Lua `PG.Sync` and `PG.Async` Aliases

The shared library also exposes `PG.Sync` and `PG.Async` namespaces for resources that use the oxmysql-style API:

```lua
-- Async (callback)
PG.Async.fetchAll('SELECT * FROM players', {}, function(result) end)
PG.Async.fetchScalar('SELECT COUNT(*) FROM players', {}, function(count) end)
PG.Async.fetchSingle('SELECT * FROM players WHERE id = ?', {id}, function(row) end)
PG.Async.insert('INSERT INTO logs (msg) VALUES (?)', {msg}, function(id) end)
PG.Async.execute('UPDATE players SET job = ? WHERE id = ?', {job, id}, function(rows) end)

-- Sync (blocking)
local result = PG.Sync.fetchAll('SELECT * FROM players')
local count  = PG.Sync.fetchScalar('SELECT COUNT(*) FROM players')
local row    = PG.Sync.fetchSingle('SELECT * FROM players WHERE id = ?', {id})
```

---

## Known Limitations

### `??` — MySQL identifier escaping

The `??` placeholder used in mysql-async for escaping column/table names is **not supported** by PostgreSQL. pry-pgadapter will throw an error if `??` is detected:

```
[pry-pgadapter] '??' (MySQL identifier escaping) is not supported in PostgreSQL.
Use double-quoted identifiers directly (e.g. "columnName").
```

**Migration:** Replace `??` with double-quoted identifiers in your query strings.

```lua
-- Before (MySQL)
exports['mysql-async']:mysql_execute('UPDATE ?? SET balance = ? WHERE id = ?', {'accounts', 100, 1})

-- After (PostgreSQL)
PG.update.await('UPDATE "accounts" SET balance = ? WHERE id = ?', {100, 1})
```

### `multipleStatements`

The `multipleStatements` connection option is not supported by PostgreSQL and is silently ignored. Use `PG.transaction` for multi-statement atomicity.

### `mysql://` URIs

If your existing `connection_string` uses the `mysql://` scheme, pry-pgadapter normalizes it to `postgresql://` automatically. However, ensure the target server is actually PostgreSQL.

---

## Migration Guide

When migrating a resource from MySQL to PostgreSQL:

1. Replace `mysql-async` / `ghmattimysql` usage with `PG.*` calls for new code.
2. For existing code, confirm that no `??` placeholders or `multipleStatements` are used.
3. Review your SQL syntax — PostgreSQL has differences from MySQL (e.g., backtick identifiers → double quotes, `AUTO_INCREMENT` → `SERIAL` or `GENERATED ALWAYS AS IDENTITY`).
4. Test all queries with `pg_debug true` enabled to verify execution and timing.
