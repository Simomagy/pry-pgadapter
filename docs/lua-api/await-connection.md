# isReady & awaitConnection

Two utility methods for checking and waiting on the database connection pool.

---

## PG.isReady

Returns `true` if the connection pool has been successfully established, `false` otherwise.

### Signature

```lua
local ready = PG.isReady()
```

### Returns

`boolean` — `true` if the pool is connected and ready to accept queries.

### Example

```lua
if PG.isReady() then
    -- safe to query immediately
else
    -- pool not yet ready
end
```

---

## PG.ready

Waits for pry-pgadapter to start and for the connection pool to be established, then invokes a callback.

### Signature

```lua
-- Callback (non-blocking — runs in a new thread)
PG.ready(function()
    -- connection is established
end)

-- Sync (blocks current coroutine)
PG.ready.await()
```

### Example

**Callback pattern (typical resource init):**

```lua
PG.ready(function()
    print('Database ready — initializing tables...')
    PG.rawExecute.await([[
        CREATE TABLE IF NOT EXISTS my_resource_data (
            id   SERIAL PRIMARY KEY,
            key  TEXT UNIQUE NOT NULL,
            data JSONB
        )
    ]])
end)
```

**Sync pattern:**

```lua
CreateThread(function()
    PG.ready.await()
    -- safe to query from this point
    local count = PG.scalar.await('SELECT COUNT(*) FROM players')
    print('Players in DB: ' .. count)
end)
```

---

## PG.awaitConnection

Low-level async method that resolves once the connection pool is available. Prefer `PG.ready` in most cases — it also waits for the pry-pgadapter resource state to be `started`.

### Signature

```lua
-- Sync
PG.awaitConnection()

-- or via export directly
exports['pry-pgadapter']:awaitConnection()
```

### Returns

`true` once the pool is connected.

---

## Recommended Pattern for Resource Initialization

```lua
-- fxmanifest.lua
shared_script '@pry-pgadapter/lib/MySQL.lua'
server_script 'server/main.lua'
```

```lua
-- server/main.lua
PG.ready(function()
    CreateThread(function()
        -- run migrations or seed data here
        PG.rawExecute.await([[
            CREATE TABLE IF NOT EXISTS ...
        ]])
    end)
end)
```
