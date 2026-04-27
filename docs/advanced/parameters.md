# Parameters & Placeholders

pry-pgadapter supports multiple placeholder styles and handles parameter normalization automatically before forwarding queries to PostgreSQL.

---

## Positional Placeholders — `?`

The `?` placeholder is the MySQL-style positional marker. pry-pgadapter converts each `?` to the corresponding `$1`, `$2`, `$3`, ... notation that PostgreSQL expects.

```lua
PG.query.await(
    'SELECT * FROM players WHERE job = ? AND grade >= ?',
    {'police', 3}
)
-- Sent to PostgreSQL as:
-- SELECT * FROM players WHERE job = $1 AND grade >= $2
-- Parameters: ['police', 3]
```

**Rules:**

* Parameters are provided as an **array** (positional, 1-indexed).
* The number of `?` placeholders must match the number of elements in the parameters array.
* If fewer parameters are provided than placeholders, missing values are filled with `NULL`.
* Providing more parameters than placeholders throws an error.

---

## Named Placeholders — `:name` / `@name`

Named placeholders are supported for readability. Use them with a **key-value table** as the parameters argument.

```lua
PG.query.await(
    'SELECT * FROM players WHERE job = :job AND grade >= :grade',
    {job = 'police', grade = 3}
)
-- Sent to PostgreSQL as:
-- SELECT * FROM players WHERE job = $1 AND grade >= $2
-- Parameters: ['police', 3]
```

Both `:name` and `@name` syntax are recognized:

```lua
-- Both are equivalent:
PG.query.await('SELECT * FROM t WHERE id = :id', {id = 1})
PG.query.await('SELECT * FROM t WHERE id = @id', {id = 1})
```

**Rules:**

* Parameters are provided as a **key-value table**.
* The same named placeholder can appear multiple times — it will be bound to the same `$N` parameter (not duplicated).
* Unknown keys in the parameters table are ignored.
* Missing named keys are bound as `NULL`.

---

## Native PostgreSQL Syntax — `$1`, `$2`, ...

You can also write queries in native PostgreSQL syntax and pass an array of parameters:

```lua
PG.query.await(
    'SELECT * FROM players WHERE job = $1 AND grade >= $2',
    {'police', 3}
)
```

Note: do not mix `?` and `$N` in the same query — use one style consistently.

---

## Unsupported — `??`

The `??` MySQL identifier escaping placeholder is **not supported**. pry-pgadapter will throw an error if it is detected:

```
[pry-pgadapter] '??' (MySQL identifier escaping) is not supported in PostgreSQL.
Use double-quoted identifiers directly (e.g. "columnName").
```

Use double-quoted identifiers in your SQL instead:

```sql
-- Instead of: SELECT ?? FROM players
SELECT "name" FROM players
```

---

## Batch INSERT — Parameter Count Limit

PostgreSQL accepts a maximum of **65,535 parameters** per query (`$1` to `$65535`). When performing a bulk insert with many rows, this limit can be hit.

pry-pgadapter automatically detects this situation and **splits large batch inserts into chunks**:

```lua
-- 10,000 rows × 5 columns = 50,000 parameters: fits in one chunk
-- 15,000 rows × 5 columns = 75,000 parameters: split into 2 chunks automatically
PG.rawExecute.await(
    'INSERT INTO logs (a, b, c, d, e) VALUES ($1, $2, $3, $4, $5)',
    rows  -- array of row arrays
)
```

Each chunk is executed sequentially. This is transparent — no changes to your code are required.

---

## NULL Handling

Passing `nil` (Lua) or `null` / `undefined` (JS/TS) as a parameter value binds it as SQL `NULL`:

```lua
PG.insert.await(
    'INSERT INTO players (name, phone) VALUES (?, ?)',
    {'John Doe', nil}
)
-- phone is inserted as NULL
```

---

## Type Coercion

pry-pgadapter does not coerce JavaScript/Lua types beyond what `node-postgres` handles natively. Lua tables are **not** automatically serialized to JSON for raw SQL parameters — they are for PGBuilder only.

For raw queries with JSONB columns, serialize manually:

```lua
local data = json.encode({level = 10, job = 'police'})
PG.update.await('UPDATE players SET data = ?::jsonb WHERE id = ?', {data, playerId})
```
