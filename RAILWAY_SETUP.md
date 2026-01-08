# Railway PostgreSQL Setup Guide

## How to Get Your DATABASE_URL from Railway

### Step 1: Access Your Railway Dashboard
1. Go to [https://railway.app](https://railway.app)
2. Log in to your account
3. Select your project (or create a new one)

### Step 2: Find Your PostgreSQL Service
1. In your project dashboard, you should see your PostgreSQL service listed
2. Click on the PostgreSQL service

### Step 3: Get the Connection String
1. In the PostgreSQL service page, go to the **"Variables"** tab
2. Look for the `DATABASE_PUBLIC_URL` variable (or `PGDATABASE`/`POSTGRES_URL`)
3. Click on the variable value or the "Copy" button next to it

The `DATABASE_URL` will look something like:
```
postgresql://postgres:password@postgres-production-0f87.up.railway.app:5432/railway
```

### Step 4: Set the Environment Variable

#### For Local Development (.env file)
Add this to your `.env` file in `afriX_backend/`:

```env
DATABASE_URL=postgresql://postgres:your_password@postgres-production-0f87.up.railway.app:5432/railway
```

#### For Railway Deployment (Environment Variables)
1. In your Railway project, go to your **application service** (not the database)
2. Click on the **"Variables"** tab
3. Add a new variable:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste your DATABASE_URL from step 3

Railway automatically injects `DATABASE_URL` if your app service is connected to the PostgreSQL service, but you can also add it manually.

### Alternative: Use Individual Variables
If you prefer to use individual variables instead of `DATABASE_URL`, you can extract them:

From the DATABASE_URL:
```
postgresql://username:password@host:port/database
```

Set these in your `.env`:
```env
DB_HOST=postgres-production-0f87.up.railway.app
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=true
```

## Configuration

The updated `database.js` configuration now automatically:
- ✅ Detects `DATABASE_URL` if provided (recommended for Railway)
- ✅ Falls back to individual `DB_*` variables if `DATABASE_URL` is not set
- ✅ Enables SSL automatically when using `DATABASE_URL` (required for Railway)
- ✅ Works with both local development and Railway production

## Testing the Connection

After setting up your `DATABASE_URL`, test the connection:

```bash
cd afriX_backend
npm start
```

Or run the database connection test:
```bash
node -e "require('./src/config/database').testConnection().then(() => process.exit(0)).catch(() => process.exit(1))"
```

## Notes

- **SSL is automatically enabled** when using `DATABASE_URL` (required for Railway)
- The host `postgres-production-0f87.up.railway.app` you provided is the Railway database host
- Railway databases require SSL connections
- Never commit your `.env` file or DATABASE_URL to git (it's already in `.gitignore`)

