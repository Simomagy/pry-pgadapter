# PG.transaction

Executes a set of queries as a **single atomic database transaction**. All queries succeed together or none of them are committed (automatic rollback on error).

---

## Signature

```lua
-- Callback
PG.transaction(queries, parameters?, callback)

-- Sync
local success = PG.transaction.await(queries, parameters?)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `queries` | `table` | Array of query definitions (see formats below). |
| `parameters` | `table?` | Shared parameters table (used when queries are plain strings). |
| `callback` | `function(success: boolean)` | Called with `true` on commit, `false` on rollback. |

### Returns

`true` if all queries were committed successfully. `false` if any query failed (transaction is rolled back automatically).

---

## Query Formats

Three formats are accepted for the `queries` argument:

**1. Array of strings** (shared parameters):

```lua
PG.transaction.await(
    {
        'INSERT INTO logs (message) VALUES (?)',
        'UPDATE counters SET total = total + 1',
    },
    {'Hello world'}
)
```

> The same `parameters` table is applied to all queries that use `?` placeholders.

**2. Array of `{query, values}` tuples:**

```lua
PG.transaction.await({
    {'INSERT INTO accounts (owner, balance) VALUES (?, ?)', {playerId, 1000}},
    {'UPDATE players SET active = true WHERE id = ?',      {playerId}},
})
```

**3. Array of `{query, parameters}` or `{query, values}` tables:**

```lua
PG.transaction.await({
    {query = 'INSERT INTO accounts (owner, balance) VALUES (?, ?)', values = {playerId, 1000}},
    {query = 'UPDATE players SET active = true WHERE id = ?',       values = {playerId}},
})
```

---

## Examples

**Money transfer (classic atomic operation):**

```lua
local success = PG.transaction.await({
    {query = 'UPDATE accounts SET balance = balance - ? WHERE owner = ?', values = {amount, senderId}},
    {query = 'UPDATE accounts SET balance = balance + ? WHERE owner = ?', values = {amount, receiverId}},
})

if not success then
    print('Transaction failed — balances unchanged.')
end
```

**Batch insert with shared parameters:**

```lua
local queries = {}

for _, item in ipairs(items) do
    queries[#queries + 1] = {
        query  = 'INSERT INTO inventory (owner, item, count) VALUES (?, ?, ?)',
        values = {owner, item.name, item.count},
    }
end

PG.transaction.await(queries)
```

---

## Transaction Isolation Level

The isolation level is configured globally via the `pg_transaction_isolation_level` convar. See [Configuration](../getting-started/configuration.md) for details.

---

## Notes

* On error, pry-pgadapter automatically calls `ROLLBACK` and logs the full error (including the failing query and its parameters).
* The events `pgadapter:transaction-error` is fired on rollback — you can listen to it for custom error handling.
* For complex, conditional transaction logic (branch on intermediate results), use [`PG.startTransaction`](start-transaction.md) instead.
