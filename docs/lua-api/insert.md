# PG.insert

Executes an `INSERT` query and returns the **ID of the inserted row**.

---

## Signature

```lua
-- Callback
PG.insert(query, parameters?, callback)

-- Sync
local insertedId = PG.insert.await(query, parameters?)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `query` | `string` | `INSERT INTO ...` SQL statement. |
| `parameters` | `table?` | Array or key-value table of bind values. |
| `callback` | `function(id: number \| nil)` | Called with the inserted row's ID. |

### Returns

The value of the first column of the first returned row (typically the primary key). Returns `nil` if no row was inserted.

---

## How It Works

pry-pgadapter automatically appends `RETURNING *` to the query if it is not already present. The response is then parsed to extract the first column of the first row (the insert ID).

If your table's primary key column is not the first column, include an explicit `RETURNING id` clause:

```lua
local id = PG.insert.await(
    'INSERT INTO logs (resource, message) VALUES (?, ?) RETURNING id',
    {'my-resource', 'Player joined'}
)
```

---

## Examples

**Basic insert:**

```lua
local id = PG.insert.await(
    'INSERT INTO players (name, job, grade) VALUES (?, ?, ?)',
    {'John Doe', 'police', 0}
)

print('Inserted player with ID: ' .. id)
```

**Named parameters:**

```lua
local id = PG.insert.await(
    'INSERT INTO vehicles (plate, model, owner) VALUES (:plate, :model, :owner)',
    {plate = 'ABC123', model = 'adder', owner = playerId}
)
```

**Callback pattern:**

```lua
PG.insert(
    'INSERT INTO transactions (account_id, amount, reason) VALUES (?, ?, ?)',
    {accountId, amount, reason},
    function(id)
        print('Transaction created: ' .. tostring(id))
    end
)
```

---

## Batch Inserts

For inserting multiple rows at once, use a single `INSERT ... VALUES (...)` with multiple tuples or rely on `PG.transaction`:

```lua
PG.transaction.await({
    {query = 'INSERT INTO items (name, weight) VALUES (?, ?)', values = {'bread', 0.5}},
    {query = 'INSERT INTO items (name, weight) VALUES (?, ?)', values = {'water', 0.3}},
})
```

> pry-pgadapter automatically handles parameter count limits (max 65535 per query) by splitting large batch inserts into multiple chunks. See [Parameters & Placeholders](../advanced/parameters.md).
