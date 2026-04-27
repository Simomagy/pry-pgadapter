# UI Dashboard

pry-pgadapter includes an in-game query profiler UI that provides a real-time overview of database activity across all resources.

---

## Enabling the UI

Set the `pg_ui` convar in `server.cfg`:

```
set pg_ui true
```

Restart the server or the pry-pgadapter resource for the change to take effect.

When enabled, every executed query is recorded in memory (up to `pg_log_size` entries per resource).

---

## Opening the UI

Run the `pgadapter` command in-game:

```
/pgadapter
```

> This command requires the **ace permission** `command.pgadapter`. Grant it to admins in `server.cfg`:
>
> ```
> add_ace group.admin command.pgadapter allow
> ```

---

## Dashboard Overview

The root view displays an aggregated summary across all resources:

| Metric | Description |
|---|---|
| Total queries | Sum of all recorded queries |
| Slow queries | Queries that exceeded `pg_slow_query_warning` |
| Total time | Cumulative execution time across all resources |
| Chart | Per-resource query count and execution time breakdown |

---

## Resource Detail View

Clicking a resource in the overview opens its detail view, which shows:

* A paginated table of recorded queries (10 per page).
* Execution time per query.
* Slow query highlighting.
* Search / filter by query string.
* Sortable columns (query text, execution time).

---

## Closing the UI

Press `Escape` or use the close button. The UI calls a NUI callback (`exit`) that releases cursor focus.

---

## Implementation Notes

The UI is built with **Svelte** and **Tailwind CSS** and served as a NUI page from `web/build/index.html`.

Communication flow:

1. Player runs `/pgadapter` → server emits `pgadapter:openUi` with aggregated stats.
2. UI opens and displays the overview.
3. User clicks a resource → UI calls `fetchResource` NUI callback → server emits `pgadapter:loadResource` with the query log for that resource.
4. UI renders the paginated query table.

The NUI page requires `pg_ui true` to function. If the convar is false, the `/pgadapter` command silently returns.

---

## UI in Production

The UI is designed for development and debugging purposes. In production:

* Keep `pg_ui false` to avoid memory overhead from query logging.
* Use `pg_slow_query_warning` and the `pgadapter:error` event for monitoring instead.
* Consider integrating an external logger (see [Logging](logging.md)) for persistent error tracking.
