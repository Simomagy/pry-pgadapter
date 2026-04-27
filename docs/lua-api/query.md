# PG.query

Executes a `SELECT` query and returns **all matching rows** as an array of tables.

---

## Signature

```lua
-- Callback
PG.query(query, parameters?, callback)

-- Sync
local rows = PG.query.await(query, parameters?)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `query` | `string` | SQL query. Supports `?` and `:name` placeholders. |
| `parameters` | `table?` | Array or key-value table of bind values. |
| `callback` | `function(rows: table[])` | Called with the result array. |

### Returns

An array of tables, where each table represents one row. Keys are column names.

Returns an **empty array** (`{}`) when no rows match — never `nil`.

---

## Examples

**All rows, no parameters:**

```lua
local players = PG.query.await('SELECT id, name, job FROM players')

for _, player in ipairs(players) do
    print(player.id, player.name, player.job)
end
```

**Positional parameters:**

```lua
local cops = PG.query.await(
    'SELECT * FROM players WHERE job = ? AND grade >= ?',
    {'police', 3}
)
```

**Named parameters:**

```lua
local cops = PG.query.await(
    'SELECT * FROM players WHERE job = :job AND grade >= :grade',
    {job = 'police', grade = 3}
)
```

**Callback (non-blocking):**

```lua
PG.query('SELECT * FROM vehicles WHERE owner = ?', {playerId}, function(vehicles)
    TriggerClientEvent('my-resource:receiveVehicles', source, vehicles)
end)
```

---

## Notes

* Use `PG.single` when you only need the first row.
* Use `PG.scalar` when you only need a single value (e.g. a count).
* `PG.query` always appends `RETURNING *` automatically on `INSERT` statements — if you are running a `SELECT`, this has no effect. For inserts, prefer `PG.insert`.
