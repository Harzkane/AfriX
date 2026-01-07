The plist file is being recreated as root. Let's take a more thorough approach:

## 1. Completely remove the service and clean up

```bash
# Stop the service
brew services stop postgresql@14

# Remove all plist files (both user and root locations)
rm -f ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
sudo rm -f ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist
sudo rm -f /Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist

# Kill any postgres processes
sudo pkill -u root postgres
pkill postgres
```

## 2. Check and fix all PostgreSQL directory permissions

```bash
# Fix data directory
sudo chown -R $(whoami):staff /usr/local/var/postgresql@14

# Fix log directory
sudo chown -R $(whoami):staff /usr/local/var/log

# Fix homebrew directories
sudo chown -R $(whoami):staff /usr/local/Cellar/postgresql@14
sudo chown -R $(whoami):staff /usr/local/opt/postgresql@14
```

## 3. Start PostgreSQL manually first to test

```bash
/usr/local/opt/postgresql@14/bin/postgres -D /usr/local/var/postgresql@14
```

This should start PostgreSQL in the foreground. If it works, you'll see log messages. Press `Ctrl+C` to stop it.

 ================================= the above works ================================= 

## 4. If manual start works, then use brew services

```bash
# Make sure you're NOT using sudo
brew services start postgresql@14

# Check status
brew services list
```

## 5. If it still shows root, check your shell initialization

```bash
# Check if there's a sudo alias or function
type brew
which brew
```

---

**If none of this works**, let's bypass brew services entirely and start it directly:

```bash
# Create a user-level launchd service manually
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

# Load it
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql@14.plist

# Check if it's running
ps aux | grep postgres
```

Try step 3 first (manual start) and let me know what happens!