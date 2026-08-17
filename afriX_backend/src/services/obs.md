Here's what was going wrong and what we changed.

## Root cause

Your logs show the real problem:

```
POST /merchants/payment-request - 400: "recipient_email" is not allowed
⚠️ API payment-request notice (using client simulation fallback)
```

When the API failed, the app **silently fell back to a local-only request** (`origin: "local"`, `verified: false`). That QR was **never saved on the server**, so:

1. Duplicate payment checks had nothing to verify against  
2. Transfers went out **without `request_id`** (your log shows no reference in the transfer body)  
3. The same QR could be scanned and paid again  
4. The new blocker correctly showed *"Request Unavailable… created locally"*

## Fixes applied

| Area | Change |
|------|--------|
| **Request creation** | Removed the local fallback — if the server call fails, the user sees an error and no QR is created |
| **QR code** | Now encodes the **payment URL** (e.g. `https://afri-x.vercel.app/pay/RQST-...`) instead of local JSON flags |
| **Scan flow** | Always verifies `RQST-*` against the server before allowing payment |
| **Confirm screen** | Re-checks request status right before transfer (blocks already-paid requests) |
| **Backend** | Added `GET /requests/payment-request/:id` for status lookups |
| **Email parsing** | Fixed corrupted emails like `agent1_ng@gmail.com"}` from bad QR parsing |

## What you need to do

1. **Deploy the backend** (Render) with the new `GET /requests/payment-request/:id` route  
2. **Rebuild the mobile app** with these changes  
3. **Create a brand-new payment request** — old QR codes/images from before this fix are not linked to the server and should be discarded  
4. Test the flow:
   - User A: Request Tokens → Send Request → share QR  
   - User B: Send Tokens → Scan QR → pay once  
   - User B: Scan the **same** QR again → should see **"Request Already Paid"**

If request creation still fails after rebuild, you'll now get a clear error on the Review screen instead of a fake local QR. Share that error message and we can trace it further.