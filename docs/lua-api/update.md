# PG.update

Executes an `UPDATE` or `DELETE` query and returns the **number of affected rows**.

---

## Signature

```lua
-- Callback
PG.update(query, parameters?, callback)

-- Sync
local affectedRows = PG.update.await(query, parameters?)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `query` | `string` | `UPDATE` or `DELETE` SQL statement. |
| `parameters` | `table?` | Array or key-value table of bind values. |
| `callback` | `function(affectedRows: number)` | Called with the number of affected rows. |

### Returns

An integer representing how many rows were modified or deleted. Returns `0` if no rows were affected.

---

## Examples

**Update a single column:**

```lua
local affected = PG.update.await(
    'UPDATE players SET job = ? WHERE id = ?',
    {'mechanic', playerId}
)

if affected == 0 then
    print('Player not found.')
end
```

**Update multiple columns with named parameters:**

```lua
PG.update.await(
    'UPDATE characters SET firstname = :first, lastname = :last WHERE citizenid = :cid',
    {first = 'John', last = 'Doe', cid = citizenId}
)
```

**Delete with callback:**

```lua
PG.update('DELETE FROM vehicles WHERE owner = ? AND plate = ?', {playerId, plate}, function(rows)
    if rows > 0 then
        print('Vehicle deleted.')
    end
end)
```

---

## Notes

* `PG.update` is the correct method for both `UPDATE` and `DELETE` statements.
* If you need the deleted/updated rows themselves, use `PG.query` with a `RETURNING *` clause:

```lua
local deleted = PG.query.await('DELETE FROM items WHERE id = ? RETURNING *', {itemId})
```
