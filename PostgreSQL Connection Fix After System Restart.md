# PostgreSQL Connection Fix After System Restart

## Problem

After restarting your Mac, PostgreSQL fails to start and you get connection errors:

- `ECONNREFUSED` errors in your Node.js application
- pgAdmin4 shows "connection refused" at port 5432
- Error: `FATAL: lock file "postmaster.pid" already exists`

## Quick Fix

Run these two commands in your terminal:

```bash
# Remove the stale lock file
rm /usr/local/var/postgresql@14/postmaster.pid

# Restart PostgreSQL
brew services start postgresql@14
```

## Verification

Check if PostgreSQL is running:

```bash
brew services list | grep postgresql
```

You should see `postgresql@14` with status `started`.

## Why This Happens

When your system restarts unexpectedly or PostgreSQL doesn't shut down cleanly, it leaves behind a `postmaster.pid` lock file. This file prevents PostgreSQL from starting because it thinks another instance is already running (even though it's not).

## Prevention

Ensure PostgreSQL starts automatically on system boot:

```bash
brew services start postgresql@14
```

This command not only starts PostgreSQL now but also configures it to start automatically whenever your Mac boots up.

## Additional Commands (If Needed)

If the above doesn't work, try:

```bash
# Stop PostgreSQL completely
brew services stop postgresql@14

# Kill any lingering processes
sudo pkill -u postgres postgres

# Remove the lock file
rm /usr/local/var/postgresql@14/postmaster.pid

# Start PostgreSQL
brew services start postgresql@14
```
