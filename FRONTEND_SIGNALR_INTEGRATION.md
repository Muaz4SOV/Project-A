# Frontend SignalR Integration Guide

## 🎯 Step-by-Step Implementation

Backend deployed hai, ab frontend me SignalR client integrate karna hai.

---

## Step 1: Install SignalR Package

Project root me terminal me run karo:

```bash
npm install @microsoft/signalr
```

---

## Step 2: Create SignalR Hook

**File**: `hooks/useLogoutSignalR.ts` (create new file)

```typescript
import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { useAuth0 } from '@auth0/auth0-react';

const BACKEND_URL = 'https://dev.dynamicpricingbuilder.com';

export const useLogoutSignalR = () => {
  const { user, isAuthenticated, logout } = useAuth0();
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !user?.sub) {
      return;
    }

    // Create SignalR connection
    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(`${BACKEND_URL}/hubs/logout`)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Retry logic: 0s, 2s, 10s, 30s, then stop
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
          return null; // Stop retrying after 60 seconds
        }
      })
      .build();

    connectionRef.current = connection;

    // Start connection
    connection.start()
      .then(() => {
        console.log('✅ SignalR Connected to Logout Hub');

        // Join user-specific group
        if (user.sub) {
          connection.invoke('JoinLogoutGroup', user.sub)
            .then(() => {
              console.log(`✅ Joined logout group for user: ${user.sub}`);
            })
            .catch(err => {
              console.error('❌ Error joining logout group:', err);
            });
        }
      })
      .catch(err => {
        console.error('❌ SignalR Connection Error:', err);
      });

    // Listen for logout event
    connection.on('UserLoggedOut', async (data: { 
      UserId: string; 
      SessionId?: string; 
      LogoutTime: string;
      Message?: string;
    }) => {
      console.log('🔔 Logout event received:', data);

      // Check if this logout is for current user
      if (data.UserId === user?.sub) {
        console.log('🚪 Current user logged out - logging out from frontend');

        // Clear all Auth0 cache
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth0') || 
              key.includes('@@auth0spajs@@') || 
              key.toLowerCase().includes('auth')) {
            localStorage.removeItem(key);
          }
        });

        // Clear session storage
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('ss_check_')) {
            sessionStorage.removeItem(key);
          }
        });

        // Disconnect SignalR before logout
        try {
          await connection.stop();
        } catch (err) {
          console.error('Error stopping SignalR connection:', err);
        }

        // Use Auth0 logout to clear session
        logout({
          logoutParams: {
            returnTo: window.location.origin
          },
          localOnly: false
        });
      }
    });

    // Handle connection events
    connection.onreconnecting((error) => {
      console.log('🔄 SignalR Reconnecting...', error);
    });

    connection.onreconnected((connectionId) => {
      console.log('✅ SignalR Reconnected. Connection ID:', connectionId);
      
      // Rejoin group after reconnection
      if (user?.sub) {
        connection.invoke('JoinLogoutGroup', user.sub)
          .catch(err => console.error('Error rejoining group:', err));
      }
    });

    connection.onclose((error) => {
      console.log('❌ SignalR Connection Closed', error);
    });

    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        // Leave group before disconnecting
        if (user?.sub) {
          connectionRef.current.invoke('LeaveLogoutGroup', user.sub)
            .catch(err => console.error('Error leaving group:', err));
        }

        // Stop connection
        connectionRef.current.stop()
          .then(() => console.log('✅ SignalR Connection Stopped'))
          .catch(err => console.error('Error stopping connection:', err));
      }
    };
  }, [isAuthenticated, user, logout]);

  return connectionRef.current;
};
```

---

## Step 3: Update App.tsx

**File**: `App.tsx`

Add SignalR hook import and use it:

```typescript
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';
import { useLogoutSignalR } from './hooks/useLogoutSignalR'; // 👈 Add this import

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const [isCheckingSso, setIsCheckingSso] = useState(true);
  const location = useLocation();
  const isCallbackRoute = location.pathname === '/callback';

  // 👇 Add SignalR logout listener
  useLogoutSignalR();

  // ... rest of your existing code (session validation, SSO check, etc.)
```

**Note**: Agar tumhare paas already session validation code hai, to wo bhi rakh sakte ho as a fallback. SignalR primary method hogi, session validation backup.

---

## Step 4: Update Navbar.tsx (Optional)

Agar logout button me koi extra logic chahiye:

**File**: `components/Navbar.tsx`

```typescript
const handleLogout = () => {
  const auth0Domain = "dev-4v4hx3vrjxrwitlc.us.auth0.com";
  const clientId = "zYRUiCf30KOiUnBCELNgek3J4lm11pLR";
  const returnTo = window.location.origin;
  
  // Clear local storage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('auth0') || key.includes('@@auth0spajs@@')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear session storage
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('ss_check_')) {
      sessionStorage.removeItem(key);
    }
  });
  
  // Redirect to Auth0 logout endpoint with federated parameter
  // This will trigger Back-Channel Logout → Backend → SignalR → Other Apps
  const logoutUrl = `https://${auth0Domain}/v2/logout?` +
    `client_id=${clientId}&` +
    `returnTo=${encodeURIComponent(returnTo)}&` +
    `federated`; // 👈 This triggers Back-Channel Logout
  
  window.location.href = logoutUrl;
};
```

---

## Step 5: Verify LogoutHub.cs

Ensure your backend `LogoutHub.cs` has these methods:

```csharp
public class LogoutHub : Hub
{
    public async Task JoinLogoutGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"logout_{userId}");
    }

    public async Task LeaveLogoutGroup(string userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"logout_{userId}");
    }
}
```

**Note**: Agar backend me group name format different hai (like `logout_{userId}`), to frontend hook me bhi same format use karo.

---

## Step 6: Test the Implementation

### Test Steps:

1. **Start Frontend**:
   ```bash
   npm run dev
   ```

2. **Open Browser Console** - ye logs dikhenge:
   - `✅ SignalR Connected to Logout Hub`
   - `✅ Joined logout group for user: auth0|...`

3. **Test Logout Flow**:
   - Project A me login karo
   - Project B me login karo (same browser ya different browser)
   - Console me SignalR connection logs dekho
   - Project A se logout karo
   - Project B me console me dekho: `🔔 Logout event received`
   - Project B automatically logout ho jayega

4. **Check Backend Logs**:
   - Backend me `/api/auth/logout-callback` endpoint hit hoga
   - Logs me dekho: `Processing logout for user: ...`
   - SignalR broadcast logs dekho

---

## Step 7: Handle CORS (if needed)

Agar CORS error aaye, backend me check karo:

**Backend `Program.cs`**:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "https://project-a-flax.vercel.app",
            "https://project-b-git-main-muhammad-muazs-projects-cc9bdaf8.vercel.app",
            "http://localhost:3000",
            "http://localhost:5173" // Vite default
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials(); // 👈 Important for SignalR
    });
});

// In middleware:
app.UseCors("AllowFrontend");
```

---

## Step 8: Troubleshooting

### Issue: SignalR Connection Failed

**Check**:
- ✅ Backend URL correct hai: `https://dev.dynamicpricingbuilder.com`
- ✅ Hub endpoint accessible: `${BACKEND_URL}/hubs/logout`
- ✅ CORS configured properly
- ✅ Backend running hai

**Test**:
```bash
curl https://dev.dynamicpricingbuilder.com/hubs/logout
```

### Issue: Group Join Failed

**Check**:
- ✅ User.sub value valid hai
- ✅ Backend LogoutHub.cs me `JoinLogoutGroup` method hai
- ✅ Group name format match karta hai

### Issue: Logout Event Not Received

**Check**:
- ✅ SignalR connection established hai
- ✅ User group me join ho gaya hai
- ✅ Backend me logout broadcast properly ho raha hai
- ✅ Console me errors nahi aa rahe

**Debug**:
- Browser Console me SignalR logs dekho
- Backend logs check karo
- Network tab me SignalR connection dekho

---

## Step 9: Remove Old Session Validation (Optional)

Agar SignalR properly kaam kar raha hai, to aggressive session validation code ko disable kar sakte ho ya remove kar sakte ho, kyunki SignalR zyada efficient hai.

**App.tsx** me session validation useEffect ko comment out kar do ya remove kar do (optional):

```typescript
// Optional: Comment out old session validation since SignalR handles it
// useEffect(() => {
//   // ... old session validation code
// }, [isAuthenticated, isCallbackRoute, getAccessTokenSilently]);
```

---

## ✅ Checklist

- [ ] SignalR package installed
- [ ] `useLogoutSignalR.ts` hook created
- [ ] `App.tsx` me hook added
- [ ] Console me connection logs dikh rahe
- [ ] Logout test kiya - dono apps me kaam kar raha hai
- [ ] CORS configured (if needed)
- [ ] Backend logs verify kiye

---

## 🎉 Final Flow

```
User Logs Out (Project A)
    ↓
Auth0 Logout Endpoint (federated)
    ↓
Auth0 → Backend: /api/auth/logout-callback
    ↓
Backend: LogoutService.ProcessLogoutTokenAsync()
    ↓
Backend: BroadcastLogoutAsync() via SignalR
    ↓
SignalR: Broadcast to Group + All Clients
    ↓
Project A & Project B: Receive "UserLoggedOut" event
    ↓
Frontend: Check if data.UserId === currentUser.sub
    ↓
Frontend: Automatic logout ✅
```

---

## 🚀 Ready to Deploy!

Jab sab test ho jaye:
1. Code commit karo
2. Deploy karo
3. Production me test karo

**Backend URL**: `https://dev.dynamicpricingbuilder.com`  
**SignalR Hub**: `https://dev.dynamicpricingbuilder.com/hubs/logout`  
**Logout Callback**: `https://dev.dynamicpricingbuilder.com/api/auth/logout-callback`

Ye implementation production-ready hai! 🎉

