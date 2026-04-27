# PG.single

Executes a `SELECT` query and returns **the first matching row**, or `nil` if no rows match.

---

## Signature

```lua
-- Callback
PG.single(query, parameters?, callback)

-- Sync
local row = PG.single.await(query, parameters?)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `query` | `string` | SQL query. Supports `?` and `:name` placeholders. |
| `parameters` | `table?` | Array or key-value table of bind values. |
| `callback` | `function(row: table \| nil)` | Called with the first row or nil. |

### Returns

A single table (row) with column names as keys, or `nil` if no rows were returned.

---

## Examples

**Lookup by primary key:**

```lua
local player = PG.single.await('SELECT * FROM players WHERE id = ?', {playerId})

if player then
    print(player.name, player.job)
end
```

**Named parameters:**

```lua
local vehicle = PG.single.await(
    'SELECT * FROM vehicles WHERE plate = :plate',
    {plate = 'ABC123'}
)
```

**Callback pattern:**

```lua
PG.single('SELECT * FROM characters WHERE citizenid = ?', {cid}, function(char)
    if not char then return end
    -- process character
end)
```

---

## Notes

* The query does **not** automatically append `LIMIT 1`. For performance on large tables, include it yourself:

```lua
local row = PG.single.await('SELECT * FROM logs ORDER BY created_at DESC LIMIT 1')
```

* Returns `nil` — not an empty table — when no rows match. Always guard with an `if` check.
