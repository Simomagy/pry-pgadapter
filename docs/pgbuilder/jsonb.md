# JSONB Support

PGBuilder has first-class support for PostgreSQL's `JSONB` column type, including containment queries, key existence checks, field extraction filters, and index management utilities.

---

## JSONB Operators in `:where`

### `json_contains` — Containment (`@>`)

Matches rows where the JSONB column **contains** the specified JSON object as a subset.

```lua
PG.from('players')
    :where({data = {json_contains = {job = 'police'}}})
    :find()
-- WHERE "data" @> '{"job":"police"}'::jsonb
```

Checks partial match — the column value must contain at least all key-value pairs in the filter object.

### `json_has_key` — Key Existence

Matches rows where the JSONB column has a specific **top-level key**.

```lua
PG.from('players')
    :where({data = {json_has_key = 'premium'}})
    :find()
-- WHERE jsonb_exists("data", 'premium')
```

> `jsonb_exists()` is used instead of the native `?` operator to avoid placeholder conflicts with pry-pgadapter's parameter parsing.

---

## Filtering on Nested JSONB Fields

Use `:whereJsonField(col, field, condition, cast?)` to filter on a specific **key inside a JSONB column**.

### Signature

```lua
builder:whereJsonField(col, field, condition, cast?)
```

| Parameter | Type | Description |
|---|---|---|
| `col` | `string` | JSONB column name |
| `field` | `string` | JSON key to extract |
| `condition` | `any` | Scalar (equality) or operator table |
| `cast` | `string?` | Optional PostgreSQL cast: `'integer'`, `'numeric'`, `'boolean'`, etc. |

### Examples

**Equality (no cast):**

```lua
PG.from('players')
    :whereJsonField('data', 'job', 'police')
    :find()
-- WHERE "data"->>'job' = 'police'
```

**Numeric comparison with cast:**

```lua
PG.from('players')
    :whereJsonField('data', 'level', {gte = 10}, 'integer')
    :find()
-- WHERE ("data"->>'level')::integer >= 10
```

**Range filter:**

```lua
PG.from('transactions')
    :whereJsonField('metadata', 'amount', {gte = 100, lte = 500}, 'numeric')
    :find()
-- WHERE ("metadata"->>'amount')::numeric >= 100 AND ("metadata"->>'amount')::numeric <= 500
```

**Combining with standard `:where`:**

```lua
PG.from('players')
    :where({job = 'police'})
    :whereJsonField('data', 'level', {gte = 5}, 'integer')
    :find()
-- WHERE "job" = 'police' AND ("data"->>'level')::integer >= 5
```

---

## JSONB Index Utilities

For queries on JSONB columns to be performant, proper indexes are essential.

### `PG.createJsonIndex(table_name, col, index_name?)`

Creates a **GIN index** on an entire JSONB column. A GIN index accelerates `@>`, `?`, `?|`, `?&` and jsonpath operators.

```lua
PG.createJsonIndex('players', 'data')
-- CREATE INDEX IF NOT EXISTS idx_players_data_gin ON "players" USING GIN ("data")
```

Custom index name:

```lua
PG.createJsonIndex('players', 'data', 'my_custom_index')
```

---

### `PG.createJsonFieldIndex(table_name, col, field, cast?, index_name?)`

Creates a **B-tree index** on a specific JSON key expression. More selective and faster than a GIN index for single-field equality/range queries.

```lua
PG.createJsonFieldIndex('players', 'data', 'level', 'integer')
-- CREATE INDEX IF NOT EXISTS idx_players_data_level
-- ON "players" (("data"->>'level')::integer)
```

Without cast:

```lua
PG.createJsonFieldIndex('players', 'data', 'job')
-- CREATE INDEX IF NOT EXISTS idx_players_data_job
-- ON "players" (("data"->>'job'))
```

---

## Storing JSONB Data

PGBuilder automatically encodes Lua tables to JSON strings when used as insert/update values:

```lua
PG.from('players'):insert({
    name = 'John',
    data = {
        job   = 'police',
        grade = 3,
        skills = {'firearms', 'driving'},
    }
})
-- data column receives: '{"job":"police","grade":3,"skills":["firearms","driving"]}'
```

No manual `json.encode` is required.

---

## Performance Recommendations

| Query pattern | Recommended index |
|---|---|
| `data @> '{"key":"val"}'` | `GIN` via `createJsonIndex` |
| `data->>'key' = 'val'` | B-tree via `createJsonFieldIndex` |
| `(data->>'key')::int >= n` | B-tree with cast via `createJsonFieldIndex` |
| `jsonb_exists(data, 'key')` | `GIN` via `createJsonIndex` |
