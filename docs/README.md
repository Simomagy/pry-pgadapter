# pry-pgadapter

**pry-pgadapter** is a FiveM resource that bridges FXServer resources with a **PostgreSQL** database. It is built on top of [node-postgres (pg)](https://node-postgres.com/) and exposes a familiar, battle-tested API surface compatible with `oxmysql`, `mysql-async`, and `ghmattimysql` — allowing you to migrate existing MySQL-based resources to PostgreSQL with minimal effort.

---

## Key Features

| Feature | Description |
|---|---|
| PostgreSQL-native | Full support for PostgreSQL via `node-postgres`. No MySQL emulation layer. |
| Lua `PG` API | Global `PG` object with sync (`await`) and async (callback) variants for every method. |
| PGBuilder | Fluent Lua query builder for type-safe, composable queries without raw SQL. |
| TypeScript / JS client | First-class `pgadapter` module for TypeScript resources. |
| Compatibility layer | Drop-in replacement for `mysql-async` and `ghmattimysql` exports. |
| Named & positional params | Supports both `?` positional and `:name` / `@name` named placeholders. |
| JSONB support | Native JSONB operators (`@>`, `jsonb_exists`) accessible from Lua and PGBuilder. |
| Transactions | Simple batch transactions and advanced manual `startTransaction`. |
| Query profiler | Slow query detection with configurable threshold and in-game UI dashboard. |
| Type casting | Automatic conversion of PostgreSQL types to Lua/JS-native equivalents. |

---

## How It Works

pry-pgadapter runs as a server-side FXServer resource. It:

1. Reads the `pg_connection_string` convar at startup.
2. Creates a connection pool via `node-postgres`.
3. Exposes exports (`PG.query`, `PG.insert`, etc.) consumed by other resources.
4. Translates the MySQL-compatible API surface (`?` placeholders, callbacks) into native PostgreSQL wire protocol calls.

Other resources import the shared Lua library (`@pry-pgadapter/lib/MySQL.lua`) to access the `PG` global, or the TypeScript package for JS-based resources.

---

## License

[LGPL-3.0-or-later](https://www.gnu.org/licenses/lgpl-3.0.html)
