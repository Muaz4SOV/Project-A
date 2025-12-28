# SignalR Global Logout - Troubleshooting Guide

## Current Issue
Project B se logout karne par Project A automatically logout nahi ho raha.

## Debugging Steps

### Step 1: Verify SignalR Connection in Both Projects

**Project A (Browser Console):**
```
✅ SignalR Connected to Logout Hub
👤 User ID: auth0|...
✅ Joined logout group for user: auth0|...
```

**Project B (Browser Console):**
```
✅ SignalR Connected to Logout Hub
👤 User ID: auth0|...
✅ Joined logout group for user: auth0|...
```

**Important:** Dono projects me same User ID hona chahiye!

### Step 2: Test Logout Flow

1. **Project A me login karo**
   - Console me SignalR connection logs dekho
   - Note the User ID

2. **Project B me login karo (SSO se)**
   - Console me SignalR connection logs dekho
   - Verify User ID same hai Project A jaisa

3. **Project B se logout karo**
   - Project A console me check karo:
     ```
     🔔 Logout event received: { UserId: '...', ... }
     📡 DEBUG: Received UserLoggedOut event (all events listener): ...
     ```

### Step 3: Check What's Happening

**If event NOT received:**
- Backend issue - SignalR not broadcasting
- Connection issue - SignalR not connected
- Group issue - User not in correct group

**If event received but user NOT logging out:**
- User ID mismatch issue
- Event handler issue
- Check console logs for:
  ```
  👤 Current user (from ref): ...
  🔍 Event UserId: ...
  ℹ️ Logout event for different user - ignoring
  ```

### Step 4: Manual Testing

**Test 1: Check User IDs Match**
```javascript
// Run in browser console on Project A
console.log('Project A User:', window.Auth0User?.sub || 'Not found');

// Run in browser console on Project B  
console.log('Project B User:', window.Auth0User?.sub || 'Not found');
```
**Both should be EXACTLY the same!**

**Test 2: Check SignalR Connection**
```javascript
// Run in browser console
// This will show current SignalR connection state
// (You'll need to expose connection via window for this)
```

### Step 5: Verify Backend

1. **Check Backend Logs:**
   - When logout happens, backend should log:
     ```
     Logout callback received
     Broadcasting logout event for user: auth0|...
     ```

2. **Check Back-Channel Logout URL:**
   - Auth0 Dashboard → Applications → Your App → Advanced Settings → OAuth
   - Back-Channel Logout URL should be:
     ```
     https://dynamicpricing-api.dynamicpricingbuilder.com/api/auth/logout-callback
     ```

### Step 6: Common Issues

#### Issue 1: User ID Mismatch
**Symptom:** Event received but `ℹ️ Logout event for different user - ignoring`

**Fix:**
- Verify both projects have same user.sub
- Check Auth0 user ID format (should be `auth0|...`)

#### Issue 2: Event Not Received
**Symptom:** No `🔔 Logout event received` in console

**Possible Causes:**
- Backend not broadcasting event
- User not in logout group
- SignalR connection dropped

**Fix:**
- Check backend logs
- Verify backend is calling SignalR broadcast
- Check network tab for SignalR connection

#### Issue 3: Connection Not Established
**Symptom:** No `✅ SignalR Connected` in console

**Fix:**
- Check backend URL: `https://dev.dynamicpricingbuilder.com`
- Check CORS configuration
- Check network tab for connection errors

## What to Share for Further Debugging

If issue persists, share:

1. **Project A Console Logs** (after login and during logout attempt)
2. **Project B Console Logs** (after login and when logout happens)
3. **Backend Logs** (when logout happens)
4. **Network Tab Screenshot** (SignalR connections)

## Quick Fixes to Try

1. **Refresh both projects** - Sometimes connection gets stale
2. **Clear browser cache** - Old tokens might interfere
3. **Check User IDs match** - Most common issue
4. **Verify backend is running** - Backend must be accessible
5. **Check Auth0 Back-Channel Logout** - Must be enabled and URL correct

---

**Next Step:** Run through all debugging steps above and share the console logs!

