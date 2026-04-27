# PG.startTransaction

{% hint style="warning" %}
**Experimental.** This API may receive breaking changes in future versions.
{% endhint %}

Provides a **manual transaction** with a callback-based query runner. Use this when you need to execute queries conditionally inside a transaction — branching based on intermediate results — which is not possible with the batch-oriented `PG.transaction`.

---

## Signature

```lua
local success = PG.startTransaction(function(query)
    -- use query() to run SQL inside the transaction
    -- return false (or throw) to trigger a rollback
    -- return true (or nothing) to commit
end)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `cb` | `function(query)` | Receives a `query` function. Must return `true` to commit or `false` to rollback. |

The `query` function passed to the callback has this signature:

```lua
local result = query(sql, parameters?)
```

It executes the SQL within the open transaction and returns the raw result. Throwing an error inside the callback also triggers a rollback.

### Returns

`true` if the transaction was committed. `false` if it was rolled back (explicit `return false` or an error).

---

## Timeout

Transactions started via `startTransaction` have a **30-second timeout**. If the callback does not complete within 30 seconds, the transaction is automatically rolled back and an error is logged.

---

## Examples

**Conditional transfer:**

```lua
local success = PG.startTransaction(function(query)
    local sender = query('SELECT balance FROM accounts WHERE owner = ? FOR UPDATE', {senderId})

    if not sender or sender.rows[1].balance < amount then
        return false  -- insufficient funds → rollback
    end

    query('UPDATE accounts SET balance = balance - ? WHERE owner = ?', {amount, senderId})
    query('UPDATE accounts SET balance = balance + ? WHERE owner = ?', {amount, receiverId})
    -- implicit return true → commit
end)

if success then
    print('Transfer complete.')
else
    print('Transfer failed — insufficient funds.')
end
```

**Read-then-write with conflict detection:**

```lua
PG.startTransaction(function(query)
    local row = query('SELECT * FROM slots WHERE id = ? FOR UPDATE', {slotId})

    if row.rows[1].locked then
        return false
    end

    query('UPDATE slots SET locked = true, owner = ? WHERE id = ?', {playerId, slotId})
end)
```

---

## Differences from `PG.transaction`

| | `PG.transaction` | `PG.startTransaction` |
|---|---|---|
| Branching on results | No | Yes |
| Syntax | Declarative (query array) | Imperative (callback) |
| Stability | Stable | Experimental |
| Timeout | No | 30 seconds |
| Use case | Simple batch atomicity | Complex conditional logic |
