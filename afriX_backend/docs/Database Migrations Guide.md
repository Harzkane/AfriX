# Database Migrations Guide

This guide covers all database schema migrations for the AfriExchange backend.

## 🚀 Quick Start

Run all migrations at once:

```bash
cd ~/Documents/backUps/AfriExchange/afriX_backend
node src/scripts/run-all-migrations.js
```

## 📋 Individual Migrations

### 1. Sync Agents Table Schema

Adds all missing columns to the `agents` table:

```bash
node src/scripts/sync-agents-schema.js
```

**Columns added:**

- `withdrawal_address` - Agent's personal wallet for USDT withdrawals
- `deposit_address` - Platform deposit address (if missing)
- `deposit_usd` - Total USDT deposited
- `available_capacity` - Tokens agent can mint/burn
- `total_minted` - Total tokens issued to users
- `total_burned` - Total tokens bought back
- Contact info fields (phone, WhatsApp, bank details)

### 2. Sync Withdrawal Requests Table

Creates or updates the `withdrawal_requests` table:

```bash
node src/scripts/sync-withdrawal-requests-schema.js
```

**Table structure:**

- `id` - UUID primary key
- `agent_id` - Foreign key to agents table
- `amount_usd` - Withdrawal amount
- `status` - pending, approved, rejected, paid
- `admin_notes` - Admin approval/rejection notes
- `paid_tx_hash` - Blockchain transaction hash
- `paid_at` - Payment timestamp

## 🔍 Verification

After running migrations, verify in PostgreSQL:

```sql
-- Check agents table schema
\d agents

-- Check withdrawal_requests table schema
\d withdrawal_requests

-- View all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('agents', 'withdrawal_requests')
ORDER BY table_name, ordinal_position;

-- Check agent statistics
SELECT
  COUNT(*) as total_agents,
  COUNT(withdrawal_address) as with_withdrawal_address,
  COUNT(deposit_address) as with_deposit_address
FROM agents;
```

## 🛠️ Troubleshooting

### Column already exists error

This is safe to ignore - the script skips existing columns automatically.

### Permission denied error

Ensure your database user has ALTER TABLE privileges:

```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### Table doesn't exist error

The scripts will create tables if they don't exist. If you get this error, ensure:

1. Database connection is working
2. Schema name is correct
3. User has CREATE TABLE privileges

## 📊 Migration Features

✅ **Idempotent** - Safe to run multiple times
✅ **Smart** - Skips existing columns/tables
✅ **Safe** - Preserves existing data
✅ **Comprehensive** - Adds columns, constraints, indexes, and comments
✅ **Informative** - Shows before/after schema comparison

## 🔐 Important Notes

1. **Backup First**: Always backup your database before running migrations in production:

   ```bash
   pg_dump -U your_user -d afrix_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test Environment**: Test migrations in development first

3. **Existing Agents**: Agents created before withdrawal_address migration will need to update their profile

4. **Validation**: The scripts add CHECK constraints for:
   - Ethereum address format (0x + 40 hex chars)
   - Rating range (0-5)
   - Withdrawal amount (must be positive)
   - Status values (valid enum values)

## 🎯 Next Steps After Migration

1. **Test Agent Registration**:

   ```bash
   POST /api/v1/agents/register
   {
     "country": "Nigeria",
     "currency": "NGN",
     <!-- "withdrawal_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" -->
     "withdrawal_address": "0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59"
   }
   ```

2. **Test Deposit Verification**:

   ```bash
   POST /api/v1/agents/deposit
   {
     "amount_usd": 100,
     "tx_hash": "0x..."
   }
   ```

3. **Test Withdrawal Request**:
   ```bash
   POST /api/v1/agents/withdraw-request
   {
     "amount_usd": 50
   }
   ```

## 📝 Migration History

| Date | Script                               | Description                             |
| ---- | ------------------------------------ | --------------------------------------- |
| 2024 | `sync-agents-schema.js`              | Add all missing columns to agents table |
| 2024 | `sync-withdrawal-requests-schema.js` | Create withdrawal_requests table        |
| 2024 | `run-all-migrations.js`              | Master script to run all migrations     |

## 🆘 Support

If you encounter issues:

1. Check the error message carefully
2. Verify database connection settings in `.env`
3. Ensure PostgreSQL is running
4. Check database user permissions
5. Review migration logs for specific errors

For persistent issues, check the error stack trace and database logs:

```bash
# PostgreSQL logs location (may vary)
tail -f /var/log/postgresql/postgresql-*.log
```
