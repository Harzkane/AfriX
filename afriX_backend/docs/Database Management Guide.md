# 🗄️ Database Management Guide

This document explains how to manage and reset the database in the **AfriX Backend** project using **Sequelize CLI**.

---

## ⚙️ Commands Overview

### 🧩 Create Database

```bash
npm run db:create
```

**Description:**
Creates a new empty database using the configuration in
`src/config/config.js`.

**Use this when:**

- Setting up the project for the first time.
- The database does not exist yet.

---

### 🔄 Drop Database

```bash
npm run db:drop
```

**Description:**
Deletes the entire database — **including all tables and data**.

**Use this when:**

- You need a completely clean database.
- You made major schema/model changes and want to start fresh.

⚠️ **Do not use in production.**
This command permanently removes all data.

---

### 🏗️ Run Migrations

```bash
npx sequelize-cli db:migrate
```

**Description:**
Creates all tables and schema defined in your Sequelize migrations.

**Use this after:**

- Running `db:create`
- Any new migration has been added

---

### 🌱 Seed Database

```bash
npx sequelize-cli db:seed:all
```

**Description:**
Populates the database with initial or sample data.

---

## 🧰 Common Workflows

### 🆕 First-Time Setup

Run these commands when starting the project locally for the first time:

```bash
npm run db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

---

### 🔁 Full Database Reset

Run these to completely rebuild your local database from scratch:

```bash
npm run db:drop
npm run db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

✅ **Effect:** Drops, recreates, and repopulates the database cleanly.

---

### 💡 Tip

You can automate the full reset with a single script in `package.json`:

```json
"scripts": {
  "db:reset": "npm run db:drop && npm run db:create && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all"
}
```

Then simply run:

```bash
npm run db:reset
```

---

### 🧱 File Reference

- **Config file:** `src/config/config.js`
- **Migrations:** `src/migrations/`
- **Seeders:** `src/seeders/`
