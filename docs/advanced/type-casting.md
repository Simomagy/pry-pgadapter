# Type Casting

PostgreSQL returns some data types as strings by default. pry-pgadapter registers custom type parsers on startup to automatically convert these to native Lua / JavaScript equivalents.

---

## Automatic Conversions

| PostgreSQL Type | Raw wire value | pry-pgadapter converts to |
|---|---|---|
| `TIMESTAMP` | ISO string (`"2024-01-15 10:30:00"`) | Unix timestamp (ms, integer) |
| `TIMESTAMPTZ` | ISO string with timezone | Unix timestamp (ms, integer) |
| `DATE` | Date string (`"2024-01-15"`) | Unix timestamp (ms, midnight UTC) |
| `INT8` / `BIGINT` | String (PostgreSQL wire protocol limitation) | JavaScript `number` / Lua number |
| `NUMERIC` / `DECIMAL` | String | JavaScript `number` (float) / Lua number |

---

## Timestamps

All date/time types are converted to **Unix timestamps in milliseconds** (same as `Date.now()` in JavaScript or `os.time() * 1000` in Lua):

```lua
local player = PG.single.await('SELECT * FROM players WHERE id = ?', {playerId})

-- player.created_at is a number (Unix ms timestamp)
local created = player.created_at / 1000  -- convert to seconds
print(os.date('%Y-%m-%d', created))
```

**In JavaScript / TypeScript:**

```typescript
const player = await pgadapter.single('SELECT * FROM players WHERE id = $1', [playerId]);
const createdAt = new Date(player.created_at);  // construct Date from ms timestamp
```

> The `DATE` type is parsed at midnight UTC (`new Date(val + ' 00:00:00').getTime()`).

---

## BIGINT / INT8

PostgreSQL returns `BIGINT` values as strings over the wire to avoid precision loss (JavaScript's `number` type cannot safely represent integers beyond `2^53`). pry-pgadapter casts them via `parseInt`:

```lua
-- COUNT(*) returns INT8 — automatically cast to Lua number
local count = PG.scalar.await('SELECT COUNT(*) FROM players')
-- count is a number, not a string
print(type(count))  -- 'number'
```

> If your `BIGINT` values exceed `Number.MAX_SAFE_INTEGER` (≈ 9 quadrillion), precision may be lost. In practice this is not a concern for FiveM use cases.

---

## NUMERIC / DECIMAL

`NUMERIC` values are cast via `parseFloat`:

```lua
local balance = PG.scalar.await('SELECT balance FROM accounts WHERE id = ?', {accountId})
-- balance is a Lua number (float)
```

---

## Types Without Automatic Conversion

The following PostgreSQL types are returned as-is (strings or native JS types):

| PostgreSQL Type | Returned as |
|---|---|
| `TEXT`, `VARCHAR`, `CHAR` | string |
| `BOOLEAN` | boolean |
| `INTEGER`, `INT2`, `INT4` | number (node-postgres handles these natively) |
| `FLOAT4`, `FLOAT8` / `REAL`, `DOUBLE PRECISION` | number |
| `JSON` | parsed JavaScript object |
| `JSONB` | parsed JavaScript object |
| `UUID` | string |
| `BYTEA` | Buffer |
| `ARRAY` types | JavaScript array |

---

## JSONB Columns

JSONB columns are returned as parsed JavaScript/Lua tables automatically by `node-postgres`. No manual `json.decode` is needed:

```lua
local player = PG.single.await('SELECT data FROM players WHERE id = ?', {playerId})
-- player.data is already a Lua table (decoded from JSON)
print(player.data.job)  -- 'police'
```

---

## Custom Type Parsers

If you need to override or add additional type parsers, you can do so in a separate resource by accessing `node-postgres` types directly. This is an advanced use case not covered by pry-pgadapter's public API.
