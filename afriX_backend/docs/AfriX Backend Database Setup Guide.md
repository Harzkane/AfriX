# 🧩 AfriX Backend Database Setup Guide

## Overview

This document explains how to configure, test, and synchronize the PostgreSQL database with Sequelize ORM in the **AfriX Backend** project.

It covers:

- Database configuration
- Model definitions
- Associations
- Command workflow for development and testing

---

## 🏗 Directory Structure

```
/src/
│
├── config/
│   ├── database.js          # Sequelize setup & connection
│   └── config.js            # Sequelize CLI config
│
├── models/
│   ├── User.js              # User model schema
│   ├── Wallet.js            # Wallet model schema
│   └── index.js             # Associations & model exports
│
└── ...
```

---

## ⚙️ 1. Database Configuration

### File: `src/config/database.js`

This file:

- Loads environment variables from `.env`
- Initializes a Sequelize connection
- Tests the connection
- Synchronizes all models

Ensure `dialectOptions.ssl` is properly configured for remote databases like **Railway**, **Render**, or **Supabase**:

```js
dialectOptions: {
  ssl:
    process.env.DB_SSL === "true"
      ? {
          require: true,
          rejectUnauthorized: false,
        }
      : false,
},
```

---

## 🧱 2. Model Definitions

You should have one file per entity model, e.g.:

- **User.js** → defines users and authentication info
- **Wallet.js** → defines token wallets linked to users

Each model imports `sequelize` from `/config/database`:

```js
const { sequelize } = require("../config/database");
```

---

## 🔗 3. Model Associations

Sequelize needs to know how your tables relate.
This is done in the central model loader.

### File: `src/models/index.js`

```js
const { sequelize } = require("../config/database");

// Import models
const User = require("./User");
const Wallet = require("./Wallet");

// Define associations
User.hasMany(Wallet, {
  foreignKey: "user_id",
  as: "wallets",
  onDelete: "CASCADE",
});

Wallet.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Wallet,
};
```

This ensures foreign keys and relationships are correctly applied during sync.

---

## 🧪 4. Database Commands

In your `package.json`, you should have:

```json
"scripts": {
  "db:drop": "npx sequelize-cli db:drop --config ./src/config/config.js --env development",
  "db:create": "npx sequelize-cli db:create --config ./src/config/config.js --env development"
}
```

---

## 🧭 5. Development Workflow

Run these commands in order when setting up or resetting your database:

```bash
# 1️⃣ Drop the database (optional if testing)
npm run db:drop

# 2️⃣ Recreate the database
npm run db:create

# 3️⃣ Test the database connection
node -e "require('./src/config/database').testConnection()"

# 4️⃣ Synchronize models (create tables & relationships)
node -e "require('./src/config/database').initDatabase()"
```

You should see logs like:

```
✅ Database connection established successfully
✅ Database models synchronized
```

---

## 📘 Notes

- In **development**, `sequelize.sync({ alter: true })` auto-adjusts tables when models change.
- In **production**, always use migrations instead of `sync`.
- All logs are written to:

  ```
  logs/database.log
  ```

- Environment configuration is handled through `.env`

---

## ✅ Example `.env` File

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=afritoken
DB_USER=postgres
DB_PASSWORD=mysecretpassword
DB_SSL=false
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
NODE_ENV=development
BCRYPT_ROUNDS=12
```

---

## 🧩 Summary

| Step | Description         | Command/File          |
| ---- | ------------------- | --------------------- |
| 1    | Drop old database   | `npm run db:drop`     |
| 2    | Create new database | `npm run db:create`   |
| 3    | Test connection     | `testConnection()`    |
| 4    | Sync models         | `initDatabase()`      |
| 5    | Manage associations | `src/models/index.js` |

---

**Author:** Harz Kane
**Project:** AfriX Backend
**Date Updated:** 2025-10-22
