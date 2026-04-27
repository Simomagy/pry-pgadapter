# Installation

## Prerequisites

* FXServer build **12913** or later (required by the resource manifest).
* A running **PostgreSQL** instance (version 12+ recommended) accessible from the FXServer host.
* Node.js **22** runtime — FXServer ships with it; no manual installation needed.

---

## Step 1 — Download the resource

Clone or download the repository and place it inside your server's resources folder:

```bash
cd resources/[core]
git clone <repository-url> pry-pgadapter
```

Alternatively, download the latest release archive and extract it as `resources/[core]/pry-pgadapter`.

---

## Step 2 — Install dependencies

pry-pgadapter ships with a `bun.lock` file. Run the install step from the resource directory:

```bash
cd resources/[core]/pry-pgadapter
bun install
```

> If `bun` is not available, `npm install` works equally well.

---

## Step 3 — Build the resource

```bash
bun run build
```

This produces `dist/build.js` (server-side bundle) and compiles the Lua library.

---

## Step 4 — Configure the connection string

Add the following convars to your `server.cfg` **before** the `ensure pry-pgadapter` line:

```
set pg_connection_string "postgresql://username:password@localhost:5432/mydatabase"
```

See the [Configuration](configuration.md) page for all available convars and connection string formats.

---

## Step 5 — Ensure the resource

```
ensure pry-pgadapter
```

On startup you should see a line similar to:

```
[PostgreSQL 16.x ...] Database server connection established!
```

If the connection fails, the console will print the error code and a hint about the connection string. Double-check your `pg_connection_string` and ensure PostgreSQL is reachable from the server host.

---

## Step 6 — Add the shared library to your resources

For any resource that needs to query the database, add the shared script to its `fxmanifest.lua`:

```lua
shared_script '@pry-pgadapter/lib/MySQL.lua'
```

This makes the global `PG` object available in both server-side and client-side scripts of that resource.

To also use the **PGBuilder** fluent query builder:

```lua
shared_script '@pry-pgadapter/lib/PGBuilder.lua'
```

> `PGBuilder.lua` must be included **after** `MySQL.lua`, or you can include both:
>
> ```lua
> shared_scripts {
>     '@pry-pgadapter/lib/MySQL.lua',
>     '@pry-pgadapter/lib/PGBuilder.lua',
> }
> ```
