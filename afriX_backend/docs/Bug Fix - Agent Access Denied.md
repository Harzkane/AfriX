# Bug Fix: 403 Access Denied for Agents Viewing Requests

## Problem
Agents were receiving a `403 Access Denied` error when trying to view details of mint or burn requests assigned to them.

## Root Cause
In `requestController.js`, the `getMintRequest` and `getBurnRequest` functions check if the logged-in user is either the owner of the request OR the assigned agent.

The check for agent is:
```javascript
const isAgent = request.agent && request.agent.user_id === userId;
```

However, the Sequelize query was fetching the `Agent` model with a limited set of attributes that **did not include `user_id`**:
```javascript
attributes: ["id", "tier", "rating", "phone_number"], // user_id was missing!
```

As a result, `request.agent.user_id` was `undefined`, causing `isAgent` to be `false`, leading to the 403 error.

## Solution
Updated `getMintRequest` and `getBurnRequest` in `src/controllers/requestController.js` to include `user_id` in the attributes list:

```javascript
attributes: ["id", "user_id", "tier", "rating", "phone_number"],
```

## Verification
- **Mint Requests**: `getMintRequest` now correctly fetches `user_id` for the agent, allowing the agent to view the request.
- **Burn Requests**: `getBurnRequest` was also updated to prevent the same issue.

## Files Modified
- `/src/controllers/requestController.js`

## Status
✅ **FIXED**
