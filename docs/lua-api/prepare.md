# PG.prepare

Executes a **prepared statement** — a query that is pre-parsed and cached server-side for repeated execution with different parameters.

---

## Signature

```lua
-- Callback
PG.prepare(query, parameters?, callback)

-- Sync
local result = PG.prepare.await(query, parameters?)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `query` | `string` | SQL query to prepare and execute. |
| `parameters` | `table?` | Array or key-value table of bind values. |
| `callback` | `function(result: any)` | Called with the query result. |

### Returns

The raw query result (same shape as `PG.rawExecute` — see [rawExecute](raw-execute.md)).

---

## When to Use `prepare`

Use `PG.prepare` when you execute the same query structure repeatedly (e.g. in a loop or on each player event) with different parameter values. The PostgreSQL server caches the query plan after the first execution, reducing parse overhead for subsequent calls.

**Typical use cases:**

* Bulk data insertions (per-entity persistence)
* Hot-path queries called on every tick or every player interaction
* Queries with complex execution plans that benefit from plan caching

---

## Examples

**Repeated lookup:**

```lua
for _, citizenId in ipairs(citizens) do
    local char = PG.prepare.await(
        'SELECT * FROM characters WHERE citizenid = $1',
        {citizenId}
    )
end
```

**Insert in a loop:**

```lua
for _, item in ipairs(itemsToSave) do
    PG.prepare.await(
        'INSERT INTO inventory (owner, item, count) VALUES ($1, $2, $3) ON CONFLICT (owner, item) DO UPDATE SET count = $3',
        {owner, item.name, item.count}
    )
end
```

---

## Notes

* `PG.prepare` uses PostgreSQL's native extended query protocol (`node-postgres` row mode). The query plan is cached per unique query string within the connection lifetime.
* Parameters must use `$1, $2, ...` positional syntax or `?` (which is automatically converted). Named placeholders (`:name`) are also supported.
* The result shape is identical to `PG.rawExecute`. Use `PG.query`, `PG.single`, or `PG.scalar` for automatic response parsing.
