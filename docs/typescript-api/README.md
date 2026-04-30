# TypeScript / JavaScript API

pry-pgadapter ships a typed client module for TypeScript and JavaScript resources running inside FXServer (e.g. resources built with `esbuild` or `bun`).

---

## Installation

The client is exported as `lib/PG.ts` (compiled to `lib/PG.js` + `lib/PG.d.ts`). If your resource uses the npm package:

```bash
# With pnpm
pnpm add @prysmastudio/pgadapter

# With Yarn
yarn add @prysmastudio/pgadapter

# With npm
npm install @prysmastudio/pgadapter
```

For local use, import relative to the resource or use the FXServer `GetResourcePath` pattern.

---

## Import

From the downloaded package:
```typescript
import { pgadapter } from '../../[core]/pry-pgadapter/lib/PG';
```
From the npm package:
```typescript
import { pgadapter } from '@prysmastudio/pgadapter';
```

All methods are fully typed. TypeScript will infer parameter and return types automatically.

---

## API Reference

The `pgadapter` object mirrors the Lua `PG` API. All methods return **Promises**.

### `pgadapter.query<T>(query, params?)`

Returns all matching rows.

```typescript
const players = await pgadapter.query<{ id: number; name: string; job: string }>(
    'SELECT id, name, job FROM players WHERE job = $1',
    ['police']
);
```

### `pgadapter.single<T>(query, params?)`

Returns the first matching row or `null`.

```typescript
const player = await pgadapter.single<{ name: string }>(
    'SELECT * FROM players WHERE id = $1',
    [playerId]
);

if (player) {
    console.log(player.name);
}
```

### `pgadapter.scalar<T>(query, params?)`

Returns the first column of the first row.

```typescript
const count = await pgadapter.scalar<number>(
    'SELECT COUNT(*) FROM players WHERE job = $1',
    ['police']
);
```

### `pgadapter.update(query, params?)`

Returns the number of affected rows.

```typescript
const affected = await pgadapter.update(
    'UPDATE players SET job = $1 WHERE id = $2',
    ['mechanic', playerId]
);
```

### `pgadapter.insert(query, params?)`

Returns the inserted row ID.

```typescript
const id = await pgadapter.insert(
    'INSERT INTO vehicles (plate, model, owner) VALUES ($1, $2, $3)',
    ['ABC123', 'adder', playerId]
);
```

### `pgadapter.prepare(query, params?)`

Executes a prepared statement.

```typescript
const result = await pgadapter.prepare(
    'SELECT * FROM inventory WHERE owner = $1',
    [playerId]
);
```

### `pgadapter.rawExecute(query, params?)`

Returns the raw `QueryResult` from node-postgres.

```typescript
const result = await pgadapter.rawExecute(
    'DELETE FROM sessions WHERE expires_at < NOW()'
);
console.log(`Deleted ${result.rowCount} sessions`);
```

### `pgadapter.transaction(queries, params?)`

Executes a batch transaction. Returns `true` on commit, `false` on rollback.

```typescript
const success = await pgadapter.transaction([
    { query: 'UPDATE accounts SET balance = balance - $1 WHERE id = $2', values: [amount, senderId] },
    { query: 'UPDATE accounts SET balance = balance + $1 WHERE id = $2', values: [amount, receiverId] },
]);
```

### `pgadapter.startTransaction(cb)`

Manual transaction with a query runner callback.

```typescript
const success = await pgadapter.startTransaction(async (query) => {
    const row = await query('SELECT balance FROM accounts WHERE id = $1 FOR UPDATE', [accountId]);

    if (row.rows[0].balance < amount) return false;

    await query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, accountId]);
    return true;
});
```

### `pgadapter.isReady()`

Returns `true` if the pool is connected.

```typescript
if (pgadapter.isReady()) {
    // safe to query
}
```

### `pgadapter.awaitConnection()`

Waits for the pool to be ready.

```typescript
await pgadapter.awaitConnection();
```

### `pgadapter.ready(callback)`

Waits for the pry-pgadapter resource to start, then invokes the callback.

```typescript
pgadapter.ready(() => {
    console.log('Database ready');
});
```

---

## Parameter Syntax

In TypeScript, use `$1, $2, ...` positional placeholders (native PostgreSQL style):

```typescript
await pgadapter.query('SELECT * FROM players WHERE job = $1 AND grade >= $2', ['police', 3]);
```

`?` placeholders (MySQL-style) are also accepted and converted internally.

---

## Query Store

Queries can be pre-registered to avoid repeated string allocations:

```typescript
const queryId = pgadapter.store('SELECT * FROM players WHERE id = $1');

const player = await pgadapter.single(queryId, [playerId]);
```

---

## Type Definitions

The full TypeScript interface is defined in `lib/MySQL.d.ts`. Generic type parameters are available on all methods:

```typescript
interface Player {
    id: number;
    name: string;
    job: string;
    grade: number;
}

const player = await pgadapter.single<Player>('SELECT * FROM players WHERE id = $1', [id]);
// player is: Player | null
```
