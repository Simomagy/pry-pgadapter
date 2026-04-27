# Lua API

## Setup

Include the shared library in your resource's `fxmanifest.lua`:

```lua
shared_script '@pry-pgadapter/lib/MySQL.lua'
```

This injects the global `PG` object into every script of your resource (both server-side and shared scripts). No explicit `require` or import is necessary.

---

## Calling Patterns

Every method on `PG` supports two calling patterns:

### Callback (non-blocking)

Pass a function as the last argument. The result is delivered asynchronously without blocking the current coroutine.

```lua
PG.query('SELECT * FROM players', {}, function(rows)
    for _, row in ipairs(rows) do
        print(row.name)
    end
end)
```

### Sync / Await (blocking)

Call `method.await(...)`. This blocks the current coroutine until the result is available. Must be called from inside a `Citizen.CreateThread` or an event handler — never from the top-level script scope.

```lua
local rows = PG.query.await('SELECT * FROM players')
```

> Internally, `.await` wraps the export call in a `promise` and resolves it via `Citizen.Await`. The FXServer scheduler ensures no other coroutine is starved.

---

## Parameter Placeholders

See [Parameters & Placeholders](../advanced/parameters.md) for the full reference. In short:

* `?` — positional placeholder, replaced by the corresponding value in the parameters array.
* `:name` / `@name` — named placeholder, replaced by the matching key in the parameters table.

```lua
-- positional
PG.query.await('SELECT * FROM players WHERE job = ?', {'police'})

-- named
PG.query.await('SELECT * FROM players WHERE job = :job', {job = 'police'})
```

---

## Available Methods

| Method | Returns | Description |
|---|---|---|
| [`PG.query`](query.md) | `table[]` | All rows matching the query |
| [`PG.single`](single.md) | `table \| nil` | First matching row, or nil |
| [`PG.scalar`](scalar.md) | `any \| nil` | First column of the first row |
| [`PG.update`](update.md) | `number` | Affected row count |
| [`PG.insert`](insert.md) | `number` | ID of the inserted row |
| [`PG.prepare`](prepare.md) | `any` | Result of a prepared statement |
| [`PG.rawExecute`](raw-execute.md) | `table[]` | Raw query result (no parsing) |
| [`PG.transaction`](transaction.md) | `boolean` | `true` on commit, `false` on rollback |
| [`PG.startTransaction`](start-transaction.md) | `boolean` | Manual transaction with query runner |
| [`PG.isReady`](await-connection.md) | `boolean` | `true` if the pool is connected |
| [`PG.awaitConnection`](await-connection.md) | — | Blocks until pool is ready |

---

## Deprecated Aliases

The following aliases are available for backward compatibility:

| Alias | Resolves to |
|---|---|
| `PG.execute` | `PG.query` |
| `PG.fetch` | `PG.query` |
| `PG.Sync.fetchAll` | `PG.query.await` |
| `PG.Async.fetchAll` | `PG.query` |
| `PG.Sync.fetchScalar` | `PG.scalar.await` |
| `PG.Async.fetchScalar` | `PG.scalar` |
| `PG.Sync.fetchSingle` | `PG.single.await` |
| `PG.Async.fetchSingle` | `PG.single` |

These aliases exist to ease migration from oxmysql and similar libraries. Prefer the canonical `PG.*` names in new code.
