# Logging

pry-pgadapter supports external error logging via a pluggable logger module. This allows you to forward database errors to a third-party service (e.g., Fivemanage, Sentry, a custom webhook) without modifying the core resource.

---

## Configuration

Set the `pg_logger_service` convar to specify the logger module to load:

```
set pg_logger_service "fivemanage"
```

### Built-in logger path

The value is treated as a relative path inside the pry-pgadapter resource directory, pointing to a JavaScript file:

```
set pg_logger_service "fivemanage"
# loads: logger/fivemanage.js
```

### External resource logger

Prefix with `@resource-name/` to load a logger file from a different resource:

```
set pg_logger_service "@my-logger-resource/logger/custom"
# loads: LoadResourceFile('my-logger-resource', 'logger/custom.js')
```

---

## Logger Module Interface

The logger file must export a **default function** that is called on every error. It receives a structured log object:

```javascript
// logger/my-logger.js
module.exports = function logger({ level, resource, message, metadata }) {
    // level    — 'error' (currently always error)
    // resource — the FiveM resource that triggered the query
    // message  — human-readable error message
    // metadata — the full error object (pg error with code, detail, etc.)
    
    fetch('https://my-logging-endpoint.com/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, resource, message, metadata }),
    });
};
```

The function is called **fire-and-forget** (not awaited), so it must not throw synchronous exceptions.

---

## Error Events (Alternative Approach)

If you prefer not to use a separate logger module, you can listen to server-side events emitted by pry-pgadapter:

```lua
AddEventHandler('pgadapter:error', function(data)
    -- Forward to your logging system
    TriggerEvent('my-logging-resource:log', {
        level    = 'error',
        resource = data.resource,
        message  = data.message,
        query    = data.query,
    })
end)

AddEventHandler('pgadapter:transaction-error', function(data)
    TriggerEvent('my-logging-resource:log', {
        level    = 'error',
        resource = data.resource,
        message  = 'Transaction failed: ' .. data.message,
    })
end)
```

---

## Fivemanage Integration

pry-pgadapter ships with a built-in Fivemanage logger in `logger/fivemanage.js`. To enable it:

```
set pg_logger_service "fivemanage"
set fivemanage_api_key "your-api-key-here"
```

This forwards all database errors to your [Fivemanage](https://fivemanage.com/) dashboard automatically.

---

## Log Object Reference

Both the logger module and the error events receive the following fields:

| Field | Type | Description |
|---|---|---|
| `level` | `string` | Always `'error'` in the current version |
| `resource` | `string` | Name of the FiveM resource that triggered the query |
| `message` | `string` | Human-readable error message |
| `metadata` | `object` | Full PostgreSQL error object (may include `code`, `detail`, `hint`, `position`) |
| `query` | `string?` | The SQL query that caused the error (when available) |
| `parameters` | `any[]?` | Bound parameters (when available) |
