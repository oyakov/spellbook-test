name: postgresql-storage
description: >
  PostgreSQL database integration for persistent storage, schema management, and performance monitoring.
  Use this skill whenever the user works with database schemas, connection pooling, complex SQL queries,
  data migrations, or performance tuning for PostgreSQL. Also use when the user mentions table structures
  (bot_state, trades_history, etc.), numeric precision, statement timeouts, or encrypted storage in the database.

## When to use
- Implementing or modifying PostgreSQL schemas and tables
- Configuring database connection pooling and timeouts
- Optimizing SQL queries for performance and reliability
- Managing trade history, price ticks, or latency logs in PostgreSQL
- Handling encrypted data storage (e.g., wallet secrets) within the database
- Troubleshooting database connection issues or query failures
- Implementing bulk data operations and migrations

## Core Concepts

### Core Functionality
- **Connection Pooling** — utilizes a pool of connections to handle multiple database requests efficiently, reducing overhead.
- **Schema Management** — maintains the structure of the database, ensuring all required tables are initialized correctly.
- **Encrypted Storage** — provides secure storage for sensitive information like wallet secrets with encryption and decryption support.
- **Numeric Precision** — uses the `NUMERIC` type for financial data (e.g., trade amounts, prices) to avoid floating-point errors.
- **Performance Monitoring** — tracks latency and price history to monitor the health and performance of the system.

### Database Schema (Standard Tables)
- `bot_state` — stores the current state and configuration of the bot.
- `trades_history` — archives all executed trades with precise timestamps and amounts.
- `price_history` — records price ticks for various assets over time.
- `latency_history` — logs system latency reports for performance analysis.
- `wallets` — manages wallet information and encrypted secrets.

## Instructions

### Pool Configuration
Configure the connection pool using the following environment variables:

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `DB_MAX_CONNECTIONS` | `10` | Maximum number of simultaneous connections in the pool. |
| `DB_MIN_CONNECTIONS` | `2` | Minimum number of idle connections to maintain. |
| `DB_ACQUIRE_TIMEOUT_SECS` | `5` | Maximum seconds to wait for a connection from the pool. |
| `DB_IDLE_TIMEOUT_SECS` | `300` | Seconds before an idle connection is closed. |
| `DB_MAX_LIFETIME_SECS` | `3600` | Maximum lifetime of a connection in the pool. |
| `DB_STATEMENT_TIMEOUT_SECS` | `30` | Maximum seconds for a single SQL statement (clamped 1-300). |

### Common SQL Patterns

**Inserting with Conflict Handling:**
```sql
INSERT INTO bot_state (key, value, updated_at)
VALUES ('active_strategy', 'mean_reversion', NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
```

**Bulk Price Insertion:**
```sql
INSERT INTO price_history (symbol, price, timestamp)
VALUES 
  ('SOL/USDC', 145.20, NOW()),
  ('BTC/USDC', 65400.00, NOW())
ON CONFLICT DO NOTHING;
```

**Querying Trade History with Precision:**
```sql
SELECT 
  trade_id, 
  symbol, 
  amount::NUMERIC, 
  price::NUMERIC, 
  timestamp 
FROM trades_history 
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

### Best Practices for Performance
1. **Use Prepared Statements** — improves security against SQL injection and increases execution speed.
2. **Indexing** — always index columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses (e.g., `timestamp`, `symbol`).
3. **Connection Lifecycle** — always release connections back to the pool immediately after use.
4. **Transaction Integrity** — use transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) for multi-step operations to ensure atomicity.
5. **Statement Timeouts** — always set a statement timeout to prevent long-running queries from blocking the pool.

## Constraints
- **NEVER** use floating-point types (`REAL`, `DOUBLE PRECISION`) for financial data — use `NUMERIC`.
- **NEVER** store plain-text secrets or private keys in the database — always encrypt them at the application level.
- **NEVER** perform full table scans in production — ensure appropriate indexes exist for all frequent queries.
- **NEVER** ignore statement timeouts — they are essential for system stability.
- **ALWAYS** use parameterized queries to prevent SQL injection.
- **ALWAYS** monitor connection pool usage to avoid "pool exhausted" errors.
- **ALWAYS** run migrations in a transaction to prevent partial schema updates.

## References
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Numeric Types](https://www.postgresql.org/docs/current/datatype-numeric.html)
- [node-postgres (pg) Documentation](https://node-postgres.com/)
- [SQL Best Practices](https://www.sqlshack.com/sql-best-practices/)
