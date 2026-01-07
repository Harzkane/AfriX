Excellent question — this is a key step to running your blockchain integrations safely and efficiently. ⚙️

Here’s exactly how to get **your own Alchemy API key** (for Polygon mainnet or testnet):

---

## 🧩 Step-by-step: Create your Alchemy API key

### 1. Go to the Alchemy dashboard

👉 [https://dashboard.alchemy.com](https://dashboard.alchemy.com)
https://auth.alchemy.com/?redirectUrl=https%3A%2F%2Fdashboard.alchemy.com%2F%3FappRedir%3D1

harzkane@gmail.com
Adidas#77877787

If you don’t already have an account, click **Sign Up** and register (you can use GitHub, Google, or email).

---

### 2. Create a new app

Once you’re logged in:

- Click the **“Create App”** button (usually top right).
- Fill in the form like this:

| Field           | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| **Name**        | AfriExchange Polygon RPC                                      |
| **Description** | RPC endpoint for AfriExchange backend blockchain interactions |
| **Chain**       | Polygon                                                       |
| **Network**     | Mainnet _(or Amoy for testnet)_                               |

Then click **Create App**.

---

### 3. Get your API key (the URL you’ll use)

After creating the app, click **“View Key”** or open your new app’s dashboard.

You’ll see several endpoints under “HTTP” — copy the one that looks like this:

```
https://polygon-mainnet.g.alchemy.com/v2/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

That long string at the end (`xxxxxxxxxxxx...`) is **yourApiKey**.

---

### 4. Update your `.env`

Replace your current RPC URL line with the full URL from Alchemy:

```bash
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

For testnet (Amoy), use:

```bash
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 5. (Optional) Test the connection

You can quickly check your RPC is working with:

```bash
curl https://polygon-mainnet.g.alchemy.com/v2/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

You should see a JSON response like:

```json
{ "jsonrpc": "2.0", "id": 1, "result": "0x12f5ab0" }
```

That means your node is live and working 🎯

---

Would you like me to show how to connect both **Polygon Mainnet and Amoy testnet** simultaneously in your `hardhat.config.cjs` and `.env`, so you can switch easily between real and test networks?
