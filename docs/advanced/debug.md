# Debug & Profiling

pry-pgadapter includes a built-in query logger and slow query detector to help diagnose performance issues during development and production.

---

## Slow Query Warning

Any query whose execution time exceeds the `pg_slow_query_warning` threshold is automatically logged to the server console, regardless of the debug setting.

**Configure the threshold (default: 200ms):**

```
set pg_slow_query_warning 500
```

**Console output example:**

```
[PostgreSQL 16.x ...] my-resource took 823.1200ms to execute a query!
SELECT * FROM players WHERE job = $1
['police']
```

---

## Debug Mode

Enable full query logging for all resources or a specific subset.

### Enable for all resources

```
set pg_debug true
```

### Enable for specific resources only

Pass a JSON array of resource names:

```
set pg_debug "[\"my-resource\",\"another-resource\"]"
```

When enabled, every executed query (regardless of execution time) is logged with timing information.

---

## Runtime Debug Toggle

The `pgadapter_debug` server command allows toggling debug logging at runtime without restarting the server. It can only be run from the **server console** (not in-game).

### Add a resource to debug filter

```
pgadapter_debug add my-resource
```

### Remove a resource from debug filter

```
pgadapter_debug remove my-resource
```

If debug was globally enabled (`pg_debug true`), adding/removing specific resources switches it to resource-selective mode.

---

## Error Events

pry-pgadapter emits server-side events on query failures that you can listen to for custom error handling or alerting:

### `pgadapter:error`

Fired when a regular query fails.

```lua
AddEventHandler('pgadapter:error', function(data)
    -- data.resource    — resource that triggered the query
    -- data.query       — the SQL query string
    -- data.parameters  — the bound parameters
    -- data.message     — error message
    -- data.err         — full error object
    print('[DB ERROR] ' .. data.resource .. ': ' .. data.message)
end)
```

### `pgadapter:transaction-error`

Fired when a `PG.transaction` fails and is rolled back.

```lua
AddEventHandler('pgadapter:transaction-error', function(data)
    print('[TX ERROR] ' .. data.resource .. ': ' .. data.message)
end)
```

---

## Log Size

When the UI is enabled, query logs are stored in memory per resource. Control the maximum entries per resource:

```
set pg_log_size 200
```

When `pg_debug` is enabled, this is automatically raised to `10000`.

---

## Recommended Development Setup

```
set pg_debug true
set pg_slow_query_warning 100
set pg_ui true
```

This configuration logs all queries, flags anything over 100ms, and enables the in-game UI for visual inspection.
