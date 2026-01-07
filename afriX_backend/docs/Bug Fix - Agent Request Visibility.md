# Bug Fix: Agent Cannot See User Buy Token Requests

## Problem
Agents were unable to see mint (buy token) requests from users in their requests screen.

## Root Cause
The `fetchPendingRequests` function in `agentSlice.ts` was calling the wrong API endpoint:
- **Wrong**: `/requests` - Returns the logged-in user's own requests
- **Correct**: `/requests/agent` - Returns requests FOR the agent

## Solution

### Files Modified

#### 1. `/src/constants/api.ts`
Added `REQUESTS` endpoint to `AGENTS` section:
```typescript
AGENTS: {
  LIST: "/agents/list",
  PROFILE: "/agents/profile",
  REGISTER: "/agents/register",
  REVIEW: "/agents/review",
  REQUESTS: "/requests/agent", // ← Added this
},
```

#### 2. `/src/stores/slices/agentSlice.ts`
Updated `fetchPendingRequests` to use correct endpoint:
```typescript
fetchPendingRequests: async () => {
  set({ loading: true, error: null });
  try {
    // Use agent-specific endpoint
    const { data } = await apiClient.get(API_ENDPOINTS.AGENTS.REQUESTS);
    const allRequests = data.data || [];

    // Filter for pending requests
    const pending = allRequests.filter((r: any) =>
      (r.status === 'pending' || r.status === 'proof_submitted' || r.status === 'escrowed')
    );

    set({ pendingRequests: pending, loading: false });
  } catch (err: any) {
    set({ error: err.message, loading: false });
  }
},
```

## Backend Verification

The backend endpoint `/requests/agent` already exists and works correctly:

**Controller**: `requestController.js` → `getAgentRequests()`

**What it does**:
1. Finds the agent record for the logged-in user
2. Fetches all mint requests where `agent_id` matches
3. Fetches all burn requests where `agent_id` matches
4. Combines and formats both types
5. Returns sorted by `created_at` (newest first)

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "mint",
      "user_id": "uuid",
      "user": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "amount": "1000",
      "token_type": "NT",
      "status": "pending",
      "payment_proof_url": "...",
      "created_at": "2025-12-10T00:00:00Z",
      "expires_at": "2025-12-10T01:00:00Z"
    }
  ]
}
```

## Testing

### Before Fix
- Agent logs in
- Navigates to Requests screen
- Sees "No pending mint requests" even though users have created requests

### After Fix
- Agent logs in
- Navigates to Requests screen
- Sees all mint and burn requests from users
- Can tap on requests to view details
- Can process requests

## Impact
- **Severity**: HIGH - Agents couldn't perform their core function
- **Users Affected**: All agents
- **Data Loss**: None - data was always there, just not displayed

## Related Files
- `/app/agent/requests.tsx` - UI that displays the requests
- `/app/agent/request-details/[id].tsx` - Detail view for each request
- Backend: `/src/controllers/requestController.js` - `getAgentRequests()`

## Status
✅ **FIXED** - Agents can now see user requests correctly
