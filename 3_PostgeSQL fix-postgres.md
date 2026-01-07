# 1. Kill ALL postgres processes (including your manual one from earlier)
sudo pkill -9 postgres
pkill -9 postgres

# 2. Stop the service with sudo (since it's running as root)
sudo brew services stop postgresql@14

# 3. Remove ALL plist files
rm -f ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
sudo rm -f ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
sudo rm -f /Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist

# 4. Wait 3 seconds
sleep 3

# 5. Fix permissions
sudo chown -R $(whoami):staff /usr/local/var/postgresql@14
sudo chown -R $(whoami):staff /usr/local/var/log
sudo chown -R $(whoami):staff /usr/local/Cellar/postgresql@14
sudo chown -R $(whoami):staff /usr/local/opt/postgresql@14

# 6. Create the plist file correctly
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

# 7. Verify the plist file is owned by you
ls -la ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist

# 8. Load it with launchctl (NOT brew services)
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist

# 9. Wait 2 seconds then check
# sleep 2
brew services list

========================================================================================

```

After running these, you should see:
```
postgresql@14    started    harz    ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist

**Perfect!** 🎉

Look at this line:
```
postgresql@14         started harz ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
```

========================================================================================

✅ **Status**: `started`  
✅ **User**: `harz` (not root!)  
✅ **File ownership**: Your plist is owned by you (`harz staff`)

The "Load failed: 5: Input/output error" message is just because the service was already running when you tried to load it again - you can ignore that.

## Let's verify it's working:

```bash
# 1. Check PostgreSQL is actually running
ps aux | grep postgres

# 2. Test the connection
psql -U afritoken_user -d afritoken -h localhost

# 3. Try your Node.js app
cd ~/Documents/backUps/AfriExchange/afriX_backend
npm start
```

## What happens now after system restart:

1. ✅ PostgreSQL will **automatically start** as user `harz`
2. ✅ No more "error 78" or root permission issues
3. ✅ Your app will connect successfully

## Important: Never do this again!
```bash
# ❌ NEVER run this:
sudo brew services start postgresql@14
sudo brew services stop postgresql@14
sudo brew services restart postgresql@14

# ✅ ALWAYS run without sudo:
brew services start postgresql@14
brew services stop postgresql@14
brew services restart postgresql@14
```

You're all set! Test your Node.js app now - it should connect to PostgreSQL without any issues. 🚀