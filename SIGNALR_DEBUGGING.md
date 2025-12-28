# SignalR Global Logout - Debugging Guide

## Problem
Project B se logout karne par Project A automatically logout nahi ho raha (mostly time).

## Solutions Applied

### 1. Improved SignalR Connection Stability ✅
- Added connection state checking before joining group
- Retry logic for joining logout group (up to 5 retries)
- Better error handling and logging
- Automatic reconnection with group rejoin

### 2. Enhanced Error Handling ✅
- Connection state verification before operations
- Exponential backoff for retries
- Detailed console logging for debugging

## How to Debug

### Step 1: Check Browser Console

Open browser console (F12) and look for these logs:

#### ✅ Success Logs:
```
✅ SignalR Connected to Logout Hub
🔗 Connection State: Connected
👤 User ID: auth0|...
✅ Joined logout group for user: auth0|...
```

#### ❌ Error Logs (if any):
```
❌ SignalR Connection Error: ...
❌ Error joining logout group: ...
🔄 SignalR Reconnecting...
```

### Step 2: Verify SignalR Connection

1. Open **Project A** in browser
2. Open Console (F12)
3. Look for: `✅ SignalR Connected to Logout Hub`
4. Look for: `✅ Joined logout group for user: auth0|...`

**If these logs don't appear:**
- Check backend URL: `https://dev.dynamicpricingbuilder.com`
- Check if backend is running
- Check CORS configuration in backend
- Check Network tab for SignalR connection errors

### Step 3: Test Logout Flow

1. **Login to both projects:**
   - Project A: Login
   - Project B: Login (should auto-login via SSO)

2. **Check SignalR connection in both:**
   - Open Console in **Project A** tab
   - Look for: `✅ SignalR Connected` and `✅ Joined logout group`
   - Open Console in **Project B** tab  
   - Look for: `✅ SignalR Connected` and `✅ Joined logout group`

3. **Logout from Project B:**
   - Click "Sign Out" in Project B
   - Check **Project A** console - should see:
     ```
     🔔 Logout event received: { UserId: 'auth0|...', ... }
     🚪 Current user logged out - performing logout
     ```

### Step 4: Check Backend Logs

Verify backend is receiving logout callbacks:

1. **Auth0 Dashboard:**
   - Go to: Applications → Your App → Advanced Settings → OAuth
   - Verify: Back-Channel Logout URL is set:
     ```
     https://dynamicpricing-api.dynamicpricingbuilder.com/api/auth/logout-callback
     ```

2. **Backend Logs:**
   - Check if `/api/auth/logout-callback` is being called when logout happens
   - Check if SignalR is broadcasting `UserLoggedOut` event
   - Check if user is in the correct group

### Step 5: Verify User Group Join

Check if user is joining the correct group:

**Backend should log:**
```
User joined logout group: auth0|...
```

**Frontend should log:**
```
✅ Joined logout group for user: auth0|...
```

## Common Issues & Fixes

### Issue 1: "SignalR Connection Error"
**Possible Causes:**
- Backend not running
- Wrong backend URL
- CORS issue
- Network firewall blocking SignalR

**Fix:**
1. Verify backend URL in `hooks/useLogoutSignalR.ts`:
   ```typescript
   const BACKEND_URL = 'https://dev.dynamicpricingbuilder.com';
   ```
2. Check backend is accessible: Open `https://dev.dynamicpricingbuilder.com` in browser
3. Check CORS configuration in backend allows your frontend domain

### Issue 2: "Error joining logout group"
**Possible Causes:**
- Connection not fully established before joining
- Backend hub method not found
- User ID mismatch

**Fix:**
- Code already has retry logic (up to 5 retries)
- Check backend has `JoinLogoutGroup` method in LogoutHub
- Verify user.sub matches between frontend and backend

### Issue 3: "Logout event not received"
**Possible Causes:**
- User not in logout group
- Backend not broadcasting to correct group
- Connection disconnected

**Fix:**
1. Check user joined group (console log: `✅ Joined logout group`)
2. Check backend is broadcasting to group: `logout_{userId}`
3. Check SignalR connection state: Should be `Connected`

### Issue 4: "Event received but user not logging out"
**Possible Causes:**
- User ID mismatch in event handler
- Event handler not set up before connection

**Fix:**
- Code now logs both current user and event UserId
- Check console: `👤 Current user: auth0|...` and `🔍 Event UserId: auth0|...`
- They should match exactly

## Testing Checklist

- [ ] Both projects show `✅ SignalR Connected` in console
- [ ] Both projects show `✅ Joined logout group` in console
- [ ] User IDs match in both projects
- [ ] Backend receives logout callback from Auth0
- [ ] Backend broadcasts `UserLoggedOut` event
- [ ] Project A receives event when Project B logs out
- [ ] Project B receives event when Project A logs out
- [ ] Logout happens automatically (no refresh needed)

## Enhanced Logging

The updated code now logs:
- Connection state changes
- User ID being used
- Group join status
- Event reception
- User ID comparison

**Check console for all these logs to identify the exact issue!**

## Next Steps if Still Not Working

1. **Verify Backend:**
   - Check backend code is deployed
   - Check backend logs for errors
   - Verify Back-Channel Logout URL in Auth0

2. **Check Network:**
   - Open Network tab in browser
   - Look for SignalR connections (usually `/hubs/logout`)
   - Check status codes (should be 200/101)

3. **Verify Auth0 Configuration:**
   - Back-Channel Logout enabled?
   - Back-Channel Logout URL correct?
   - Backend endpoint accessible?

4. **Test Direct Backend Call:**
   - Try calling backend logout endpoint directly
   - Check if SignalR broadcasts event
   - Verify frontend receives it

---

**If issue persists, share console logs and backend logs for further debugging!**

