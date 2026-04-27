# pry-pgadapter — Benchmark Results

> Tested on v1.0.0. All tests passed (37/37).

## CRUD — Small (100 rows)

| Operation | Time | Throughput |
|---|---|---|
| INSERT sequential (100 rows) | 72 ms | 1,388 rows/s |
| INSERT via TRANSACTION (100 rows) | 30 ms | 3,334 rows/s |
| SELECT sequential (200 queries) | 107 ms | 1,870 rows/s |
| UPDATE all 100 rows | 1 ms | 100,000 rows/s |

## CRUD — Medium (1,000 rows)

| Operation | Time | Throughput |
|---|---|---|
| BATCH INSERT via prepare (1,000 rows) | 17 ms | 58,824 rows/s |
| SELECT ALL (1,000 rows) | 12 ms | 83,334 rows/s |
| SELECT WHERE + ORDER BY (~100 rows) | 2 ms | 50,000 rows/s |
| UPDATE all 1,000 rows | 5 ms | 200,000 rows/s |
| INSERT via TRANSACTION (500 rows) | 98 ms | 5,102 rows/s |

## CRUD — Large (10,000 rows)

| Operation | Time | Throughput |
|---|---|---|
| BATCH INSERT via prepare (10,000 rows) | 82 ms | 121,952 rows/s |
| SELECT ALL (10,000 rows) | 44 ms | 227,272 rows/s |
| SELECT WHERE + ORDER BY (~1,000 rows) | 5 ms | 200,000 rows/s |
| UPDATE all 10,000 rows | 36 ms | 277,778 rows/s |

## JSONB — By Payload Size

| Payload | Operation | Rows | Time | Throughput |
|---|---|---|---|---|
| 256 KB | WRITE | 792 | 26 ms | 30,462 rows/s |
| 256 KB | READ ALL | 792 | 11 ms | 72,000 rows/s |
| 256 KB | FIELD QUERY | — | 1 ms | — |
| 256 KB | EXTRACT field | 792 | 3 ms | 264,000 rows/s |
| 1 MB | WRITE | 3,168 | 93 ms | 34,064 rows/s |
| 1 MB | READ ALL | 3,168 | 41 ms | 77,268 rows/s |
| 1 MB | FIELD QUERY | — | 2 ms | — |
| 1 MB | EXTRACT field | 3,168 | 5 ms | 633,600 rows/s |
| 5 MB | WRITE | 15,840 | 536 ms | 29,552 rows/s |
| 5 MB | READ ALL | 15,840 | 148 ms | 107,028 rows/s |
| 5 MB | FIELD QUERY | — | 5 ms | — |
| 5 MB | EXTRACT field | 15,840 | 26 ms | 609,230 rows/s |

## Highlights

- **Fastest write**: BATCH INSERT via prepare — up to **121,952 rows/s** at 10k rows
- **Fastest read**: SELECT ALL at 10k — **227,272 rows/s**
- **Fastest update**: UPDATE at 10k — **277,778 rows/s**
- **JSONB extract** scales extremely well — **633,600 rows/s** on 1 MB payload
- **TRANSACTION overhead** is significant at small scales (3,334 vs 58,824 rows/s for batch)
