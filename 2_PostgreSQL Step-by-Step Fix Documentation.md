Perfect! PostgreSQL is running. Now let's make it permanent and document everything.

## Step-by-Step Fix Documentation

### **Problem**: PostgreSQL won't start after system restart (Error 78 - running as root)

### **Root Cause**: 
The brew services plist file was owned by root (likely from running `sudo brew services` at some point), causing PostgreSQL to attempt starting as root, which it refuses for security reasons.

---

## **Complete Fix Process**

### **Step 1: Stop PostgreSQL and clean up all service files**

```bash
# Stop the service
brew services stop postgresql@14

# Remove all plist files (user and root locations)
rm -f ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
sudo rm -f ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
sudo rm -f /Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist

# Kill any running postgres processes
sudo pkill -u root postgres
pkill postgres
```

### **Step 2: Fix ownership of all PostgreSQL directories**

```bash
# PostgreSQL data directory
sudo chown -R $(whoami):staff /usr/local/var/postgresql@14

# Log directory
sudo chown -R $(whoami):staff /usr/local/var/log

# PostgreSQL installation directories
sudo chown -R $(whoami):staff /usr/local/Cellar/postgresql@14
sudo chown -R $(whoami):staff /usr/local/opt/postgresql@14
```

### **Step 3: Test PostgreSQL manually** (Optional but recommended)

```bash
# Start PostgreSQL in foreground to verify it works
/usr/local/opt/postgresql@14/bin/postgres -D /usr/local/var/postgresql@14

# You should see:
# LOG:  database system is ready to accept connections

# Press Ctrl+C to stop it
```

### **Step 4: Start PostgreSQL as a service properly**

Since `brew services` might recreate the root issue, press `Ctrl+C` in your current terminal to stop the manual PostgreSQL process, then:

```bash
# Create the permanent service fix: the plist file manually with correct ownership
cat > ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>homebrew.mxcl.postgresql@14</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/opt/postgresql@14/bin/postgres</string>
    <string>-D</string>
    <string>/usr/local/var/postgresql@14</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>/usr/local</string>
  <key>StandardErrorPath</key>
  <string>/usr/local/var/log/postgresql@14.log</string>
  <key>StandardOutPath</key>
  <string>/usr/local/var/log/postgresql@14.log</string>
</dict>
</plist>
EOF

# Load the service
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
```

Done! PostgreSQL will now:

✅ Start automatically when your Mac boots
✅ Restart automatically if it crashes
✅ Run as your user (harz), not root

### **Step 5: Verify PostgreSQL is running**

```bash
# Check running processes
ps aux | grep postgres

# Test connection
psql -U afritoken_user -d afritoken -h localhost

# Check with brew services
brew services list
# Should show: postgresql@14    started    harz
```

---

## **Quick Reference Commands**

### **Start PostgreSQL**
```bash
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
# OR
brew services start postgresql@14
```

### **Stop PostgreSQL**
```bash
launchctl unload ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
# OR
brew services stop postgresql@14
```

### **Restart PostgreSQL**
```bash
launchctl unload ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
# OR
brew services restart postgresql@14
```

### **Check PostgreSQL status**
```bash
brew services list
ps aux | grep postgres
lsof -i :5432
```

### **View PostgreSQL logs**
```bash
tail -f /usr/local/var/log/postgresql@14.log
```

---

## **Prevention Tips**

1. **NEVER use `sudo` with brew services**
   ```bash
   # ❌ WRONG
   sudo brew services start postgresql@14
   
   # ✅ CORRECT
   brew services start postgresql@14
   ```

2. **If PostgreSQL won't start after system restart**, check:
   - `brew services list` - look for "root" in the User column
   - Check logs: `tail /usr/local/var/log/postgresql@14.log`

3. **Regular maintenance**
   ```bash
   # Update PostgreSQL
   brew upgrade postgresql@14
   brew services restart postgresql@14
   ```

---

Now go ahead and press `Ctrl+C` to stop the manual PostgreSQL process, then run Step 4 to set it up as a proper background service!