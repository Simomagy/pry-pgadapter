# PG.rawExecute

Executes a query and returns the **raw PostgreSQL result** without any response transformation. This is the lowest-level query method available.

---

## Signature

```lua
-- Callback
PG.rawExecute(query, parameters?, callback)

-- Sync
local result = PG.rawExecute.await(query, parameters?)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `query` | `string` | Any valid SQL statement. |
| `parameters` | `table?` | Array or key-value table of bind values. |
| `callback` | `function(result: table)` | Called with the raw result object. |

### Returns

The raw result object from `node-postgres` (`QueryResult`), which includes:

| Field | Type | Description |
|---|---|---|
| `rows` | `table[]` | Array of row objects |
| `rowCount` | `number` | Number of rows returned or affected |
| `command` | `string` | SQL command tag (e.g. `SELECT`, `INSERT`) |
| `fields` | `table[]` | Column metadata |

---

## When to Use `rawExecute`

Prefer the typed methods (`PG.query`, `PG.single`, etc.) in most situations. Use `PG.rawExecute` when:

* You need access to the `rowCount` on a `SELECT` statement.
* You need column metadata (`fields`).
* You are building a generic query wrapper or ORM layer.
* You want to execute DDL statements (`CREATE TABLE`, `ALTER TABLE`) and inspect the result.

---

## Examples

**DDL execution:**

```lua
PG.rawExecute.await([[
    CREATE TABLE IF NOT EXISTS my_table (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
    )
]])
```

**Inspecting the command tag:**

```lua
local result = PG.rawExecute.await('DELETE FROM sessions WHERE expires_at < NOW()')
print('Deleted ' .. result.rowCount .. ' expired sessions.')
```

---

## Notes

* `PG.prepare` is `PG.rawExecute` with the `prepared` flag enabled (cached query plan).
* No response parsing is applied: `INSERT` does not automatically add `RETURNING *`, and the result is not filtered to rows/counts.
