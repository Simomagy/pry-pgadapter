# PG.scalar

Executes a query and returns **the value of the first column of the first row** — ideal for aggregate functions like `COUNT`, `SUM`, `MAX`, etc.

---

## Signature

```lua
-- Callback
PG.scalar(query, parameters?, callback)

-- Sync
local value = PG.scalar.await(query, parameters?)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `query` | `string` | SQL query. Typically a single-column `SELECT`. |
| `parameters` | `table?` | Array or key-value table of bind values. |
| `callback` | `function(value: any \| nil)` | Called with the scalar value or nil. |

### Returns

The raw value of the first column of the first row, or `nil` if the result set is empty.

---

## Examples

**Count rows:**

```lua
local count = PG.scalar.await('SELECT COUNT(*) FROM players WHERE job = ?', {'police'})
print('Officers online: ' .. count)
```

**Aggregate value:**

```lua
local total = PG.scalar.await('SELECT SUM(amount) FROM transactions WHERE account_id = ?', {accountId})
```

**Existence check:**

```lua
local exists = PG.scalar.await(
    'SELECT EXISTS(SELECT 1 FROM players WHERE identifier = ?)',
    {identifier}
)

if exists then
    -- player record found
end
```

**Named parameters:**

```lua
local maxGrade = PG.scalar.await(
    'SELECT MAX(grade) FROM players WHERE job = :job',
    {job = 'police'}
)
```

**Callback pattern:**

```lua
PG.scalar('SELECT COUNT(*) FROM vehicles WHERE owner = ?', {playerId}, function(count)
    TriggerClientEvent('my-resource:vehicleCount', source, count)
end)
```

---

## Type Casting

PostgreSQL returns numeric types as strings in some cases. pry-pgadapter automatically casts:

* `BIGINT` / `INT8` → Lua number
* `NUMERIC` / `DECIMAL` → Lua number (float)
* `COUNT(*)` returns a `BIGINT` and is automatically cast to a Lua number.

See [Type Casting](../advanced/type-casting.md) for the full list.
