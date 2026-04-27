# Operators

PGBuilder supports a rich set of comparison operators for the `:where(conditions)` method.

---

## Basic Equality

Pass a scalar value to match with `=`:

```lua
PG.from('players'):where({job = 'police'}):find()
-- WHERE "job" = 'police'

PG.from('players'):where({job = 'police', grade = 3}):find()
-- WHERE "job" = 'police' AND "grade" = 3
```

Multiple conditions in the same table are joined with `AND`.

---

## Comparison Operators

Pass an operator table as the value:

```lua
:where({column = {operator = value}})
```

| Operator key | SQL operator | Example |
|---|---|---|
| `gt` | `>` | `{level = {gt = 10}}` |
| `gte` | `>=` | `{grade = {gte = 3}}` |
| `lt` | `<` | `{age = {lt = 18}}` |
| `lte` | `<=` | `{score = {lte = 100}}` |
| `ne` | `!=` | `{status = {ne = 'banned'}}` |
| `like` | `LIKE` | `{name = {like = 'John%'}}` |
| `ilike` | `ILIKE` | `{name = {ilike = '%doe%'}}` |

**Examples:**

```lua
-- level >= 10
PG.from('characters'):where({level = {gte = 10}}):find()

-- name contains 'doe' (case-insensitive)
PG.from('players'):where({name = {ilike = '%doe%'}}):find()

-- grade not equal to 0
PG.from('players'):where({grade = {ne = 0}}):count()
```

---

## Set Operators

### `in_` — value in a set

```lua
PG.from('players'):where({job = {in_ = {'police', 'ambulance', 'fire'}}}):find()
-- WHERE "job" IN ('police', 'ambulance', 'fire')
```

### `not_in` — value not in a set

```lua
PG.from('players'):where({status = {not_in = {'banned', 'inactive'}}}):find()
-- WHERE "status" NOT IN ('banned', 'inactive')
```

> `in_` and `not_in` require a **non-empty array**. Passing an empty table will throw an assertion error.

---

## NULL Checks

### `is_null` — IS NULL / IS NOT NULL

```lua
-- IS NULL
PG.from('vehicles'):where({deleted_at = {is_null = true}}):find()
-- WHERE "deleted_at" IS NULL

-- IS NOT NULL
PG.from('vehicles'):where({owner = {is_null = false}}):find()
-- WHERE "owner" IS NOT NULL
```

---

## JSONB Operators

For JSONB column filtering, see [JSONB Support](jsonb.md):

| Operator key | SQL | Use case |
|---|---|---|
| `json_contains` | `col @> ?::jsonb` | Object containment |
| `json_has_key` | `jsonb_exists(col, ?)` | Key existence |

---

## Combining Conditions

All conditions in the same `:where({})` table are combined with `AND`. For more complex logic (e.g., `OR`), use raw SQL with `PG.query.await`:

```lua
-- AND (via PGBuilder)
PG.from('players'):where({job = 'police', grade = {gte = 3}}):find()

-- OR (raw SQL)
PG.query.await('SELECT * FROM players WHERE job = ? OR grade >= ?', {'police', 10})
```
