admin@gmail.com
password123

npx expo start

open /Users/harz/.gemini/antigravity/brain/e5ece57f-d884-4a56-9db0-65da61744289/deployment_guide.md

DB_USE_LOCAL=false DATABASE_URL="postgresql://afrix_user:k71s4A6aUhtJCOTKk6NJRx6mK7wAnTSU@dpg-d6ahr5i48b3s73bavbh0-a.frankfurt-postgres.render.com/afrix_db_ekq5" 

DB_SSL=true node afriX_backend/src/scripts/init_production.js

agent
dispute
escrows
merchant
request
users
payments
transactions
wallets


NEW PROD ADMIN:

node src/scripts/create_admin_production.js
[dotenv@17.2.3] injecting env (111) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
[dotenv@17.2.3] injecting env (0) from .env -- tip: ✅ audit secrets and track compliance: https://dotenvx.com/ops
🚀 connecting to DB...
✅ Database connected
👤 Creating new admin user: admin@gmail.com
✅ Admin user created successfully!
📧 Email: admin@gmail.com
🔑 Password: password123


check your current tUSDT token and MATIC gas balances on the Polygon Amoy testnet.
npx hardhat run scripts/checkBalances.js --network amoy



========================= error===========================

connection failed: connection to server at "::1", port 5432 failed: could not receive data from server: Connection refused:




Haha, no! I definitely don't want to remove your PostgreSQL! 😄 

I was only trying to delete a small temporary lock file called `postmaster.pid`. When PostgreSQL is running, it creates this file to lock the database. If your Mac crashes, restarts abruptly, or Postgres is killed improperly, this file gets left behind. 

Because that stale file is still sitting there from July 11th, PostgreSQL thinks it's already running and is refusing to start (which is why `brew services start postgresql@14` fails with `Bootstrap failed: 5: Input/output error`). 

Removing just that `.pid` file is completely safe and is the standard way to fix this issue. Your actual databases and data are perfectly safe!

If you are comfortable with it, please allow me to remove just the stale lock file and restart the service so your backend can connect:

```bash
rm /usr/local/var/postgresql@14/postmaster.pid
brew services restart postgresql@14
```

Would you like me to go ahead and run this to get your database back online?