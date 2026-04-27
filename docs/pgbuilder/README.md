# PGBuilder

PGBuilder is a **fluent Lua query builder** for pry-pgadapter. It generates safe, parameterized SQL without writing raw query strings, making common CRUD operations concise and readable.

---

## Setup

Include PGBuilder in your resource's `fxmanifest.lua` **after** `MySQL.lua`:

```lua
shared_scripts {
    '@pry-pgadapter/lib/MySQL.lua',
    '@pry-pgadapter/lib/PGBuilder.lua',
}
```

This makes `PG.from` available globally in your scripts.

---

## Entry Point

All queries start with `PG.from(table_name)`, which returns a new builder instance:

```lua
local builder = PG.from('players')
```

Builder methods are **chainable** — each one returns the same builder:

```lua
PG.from('players')
    :where({job = 'police'})
    :orderBy('grade', 'DESC')
    :limit(10)
    :find()
```

---

## Terminal Methods

These methods execute the query and return the result. They can be called with or without a callback:

| Method | SQL | Returns |
|---|---|---|
| `:find(cb?)` | `SELECT ... FROM ...` | `table[]` — all matching rows |
| `:first(cb?)` | `SELECT ... FROM ... LIMIT 1` | `table \| nil` — first row |
| `:count(cb?)` | `SELECT COUNT(*) FROM ...` | `number` |
| `:insert(data, cb?)` | `INSERT INTO ...` | `number` — inserted ID |
| `:update(data, cb?)` | `UPDATE ... SET ...` | `number` — affected rows |
| `:delete(cb?)` | `DELETE FROM ...` | `number` — affected rows |

---

## Builder Methods

These methods configure the query and return `self` for chaining:

| Method | Description |
|---|---|
| `:select(col1, col2, ...)` | Columns to SELECT. Default: `*` |
| `:where(conditions)` | Filter conditions. See [Operators](operators.md). |
| `:whereJsonField(col, field, condition, cast?)` | Filter on a JSONB field. See [JSONB Support](jsonb.md). |
| `:orderBy(col, dir?)` | `ORDER BY col ASC\|DESC`. Default dir: `ASC`. |
| `:limit(n)` | `LIMIT n`. Must be a positive integer. |
| `:offset(n)` | `OFFSET n`. Must be a non-negative integer. |

---

## Quick Examples

**Find all rows:**

```lua
local players = PG.from('players'):find()
```

**Find with filters:**

```lua
local officers = PG.from('players')
    :where({job = 'police', grade = {gte = 3}})
    :orderBy('grade', 'DESC')
    :find()
```

**First matching row:**

```lua
local player = PG.from('players'):where({identifier = identifier}):first()

if player then
    print(player.name)
end
```

**Count:**

```lua
local count = PG.from('players'):where({job = 'police'}):count()
print('Officers: ' .. count)
```

**Insert:**

```lua
local id = PG.from('players'):insert({
    name       = 'John Doe',
    identifier = 'steam:abc123',
    job        = 'civilian',
    grade      = 0,
})
```

**Update:**

```lua
PG.from('players'):where({id = playerId}):update({job = 'mechanic', grade = 1})
```

**Delete:**

```lua
PG.from('sessions'):where({expires_at = {lt = os.time()}}):delete()
```

**Callback (non-blocking):**

```lua
PG.from('players'):where({job = 'police'}):find(function(officers)
    for _, o in ipairs(officers) do
        print(o.name)
    end
end)
```

---

## Lua Table Values → JSON

When passing a Lua table as a column value in `:insert` or `:update`, PGBuilder automatically serializes it to a JSON string. This is transparent — no manual `json.encode` needed:

```lua
PG.from('players'):insert({
    name = 'John',
    data = {level = 10, skills = {'driving', 'shooting'}},  -- auto-encoded to JSON
})
```

This is especially useful for `JSONB` columns.
