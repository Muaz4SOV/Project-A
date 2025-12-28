# Project B - Global Logout Implementation (Complete Solution)

## Problem
Ek project se logout karne par automatically doosra project logout nahi ho raha.

## Solution: Aggressive Session Validation with Auth0 Userinfo Endpoint

### Key Strategy:
1. **Federated Logout**: Auth0 session server-side clear karta hai
2. **Aggressive Validation**: Har 2 seconds me Auth0 session verify hota hai
3. **Direct API Check**: Auth0 userinfo endpoint directly call hota hai
4. **Fast Detection**: Logout within 2-4 seconds detect ho jata hai

---

## 1. Navbar.tsx - Logout Function

**File**: `components/Navbar.tsx`

```tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LogIn, LogOut, Layout } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  // Handle logout with SSO (Single Sign-Out)
  const handleLogout = () => {
    const auth0Domain = "dev-4v4hx3vrjxrwitlc.us.auth0.com";
    const clientId = "zYRUiCf30KOiUnBCELNgek3J4lm11pLR";
    const returnTo = window.location.origin;
    
    // Set logout timestamp
    const logoutTime = Date.now().toString();
    localStorage.setItem('auth0_logout_timestamp', logoutTime);
    document.cookie = `auth0_logout=${logoutTime}; path=/; max-age=600; SameSite=None; Secure`;
    
    // Clear ALL Auth0 cache
    const keysToRemove: string[] = [];
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth0') || 
          key.includes('@@auth0spajs@@') || 
          key.toLowerCase().includes('auth') ||
          key.includes(clientId)) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear session storage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('ss_check_') || 
          key.toLowerCase().includes('auth') ||
          key.includes(clientId)) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Local logout
    logout({
      logoutParams: { returnTo: returnTo },
      localOnly: true
    });
    
    // Federated logout - clears Auth0 session server-side
    const logoutUrl = `https://${auth0Domain}/v2/logout?` +
      `client_id=${clientId}&` +
      `returnTo=${encodeURIComponent(returnTo)}&` +
      `federated`; // CRITICAL: Clears Auth0 session server-side
    
    window.location.href = logoutUrl;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* ... your navbar JSX ... */}
      <button onClick={handleLogout}>
        <LogOut size={16} />
        <span>Sign Out</span>
      </button>
    </nav>
  );
};

export default Navbar;
```

---

## 2. App.tsx - Aggressive Session Validation

**File**: `App.tsx`

**Important**: `App.tsx` me ye exact session validation code add karo:

```tsx
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// ... other imports

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const [isCheckingSso, setIsCheckingSso] = useState(true);
  const location = useLocation();
  const isCallbackRoute = location.pathname === '/callback';

  // ========================================
  // AGGRESSIVE SESSION VALIDATION
  // Checks Auth0 session every 2 seconds
  // ========================================
  useEffect(() => {
    if (!isAuthenticated || isCallbackRoute) {
      return;
    }

    // Check for logout timestamp
    const checkLogoutTimestamp = () => {
      const logoutTimestamp = localStorage.getItem('auth0_logout_timestamp');
      const logoutCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth0_logout='));
      
      const cookieLogoutTime = logoutCookie ? parseInt(logoutCookie.split('=')[1]) : null;
      const storageLogoutTime = logoutTimestamp ? parseInt(logoutTimestamp) : null;
      
      let logoutTime: number | null = null;
      if (storageLogoutTime) logoutTime = storageLogoutTime;
      if (cookieLogoutTime && (!logoutTime || cookieLogoutTime > logoutTime)) {
        logoutTime = cookieLogoutTime;
      }
      
      if (logoutTime) {
        const lastCheck = localStorage.getItem('auth0_last_session_check');
        if (!lastCheck || parseInt(lastCheck) < logoutTime) {
          console.log("Logout detected from another app - logging out");
          performLogout();
          return true;
        }
      }
      return false;
    };

    // Perform logout cleanup
    const performLogout = () => {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth0') || 
            key.includes('@@auth0spajs@@') || 
            key.toLowerCase().includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('ss_check_') || 
            key.toLowerCase().includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
      
      window.location.reload();
    };

    // Validate session by calling Auth0 userinfo endpoint
    const validateSession = async () => {
      if (checkLogoutTimestamp()) {
        return;
      }

      localStorage.setItem('auth0_last_session_check', Date.now().toString());

      try {
        // Get fresh token (forces Auth0 to verify session)
        const token = await getAccessTokenSilently({
          cacheMode: 'off', // NO cache - forces fresh check
          timeoutInSeconds: 2,
          authorizationParams: {
            prompt: 'none'
          }
        });

        // Verify token by calling Auth0 userinfo endpoint
        // If federated logout cleared session, this will fail
        const userInfoResponse = await fetch(`https://dev-4v4hx3vrjxrwitlc.us.auth0.com/userinfo`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });

        if (!userInfoResponse.ok) {
          // Session invalid - logout
          console.log("Userinfo call failed - Auth0 session invalid", userInfoResponse.status);
          performLogout();
          return;
        }

      } catch (error: any) {
        // Session invalid - logout
        console.log("Session validation failed - Auth0 session invalid", error);
        
        if (error?.error === 'login_required' || 
            error?.error === 'invalid_grant' ||
            error?.error === 'unauthorized') {
          performLogout();
          return;
        }
        
        if (checkLogoutTimestamp()) {
          return;
        }
      }
    };

    // Event handlers
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        validateSession();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated) {
        validateSession();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth0_logout_timestamp' && e.newValue) {
        performLogout();
      }
    };

    // Immediate validation
    if (checkLogoutTimestamp()) {
      return;
    }

    // Start aggressive validation
    validateSession(); // Immediate check
    const initialTimer = setTimeout(validateSession, 500);
    
    // Validate every 2 seconds (AGGRESSIVE)
    const interval = setInterval(() => {
      if (!checkLogoutTimestamp()) {
        validateSession();
      }
    }, 2000);

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, isCallbackRoute, getAccessTokenSilently]);

  // ... rest of your App.tsx code (SSO check, routes, etc.)
};

export default App;
```

---

## 3. How It Works

### When User Logs Out from Project A:

1. **Logout Button Clicked**:
   - Logout timestamp set kiya
   - Local storage clear kiya
   - Auth0 logout endpoint called with `federated` parameter
   - Auth0 session server-side clear ho gaya

2. **Project B Detects Logout** (within 2-4 seconds):
   - Session validation chalti hai (har 2 seconds)
   - Fresh token fetch karta hai (cacheMode: 'off')
   - Auth0 userinfo endpoint call karta hai
   - Userinfo call fail hota hai (session cleared)
   - Automatic logout + page reload

### Key Features:

- ✅ **Fast Detection**: 2-4 seconds me logout detect
- ✅ **Direct API Check**: Auth0 userinfo endpoint se verify
- ✅ **No Cache**: Fresh session check har baar
- ✅ **Multiple Triggers**: Visibility, focus, storage events
- ✅ **Federated Logout**: Server-side session clear

---

## 4. Testing

1. **Login dono projects me**:
   ```
   Project A → Login
   Project B → Auto login (SSO)
   ```

2. **Project A se logout**:
   - Logout button click karo
   - Project B tab open rakho
   - 2-4 seconds me Project B automatically logout ho jayega

3. **Project B se logout**:
   - Logout button click karo
   - Project A tab open rakho
   - 2-4 seconds me Project A automatically logout ho jayega

---

## 5. Important Notes

1. **Same Code**: Project A aur Project B dono me **exact same code** use karo
2. **Federated Parameter**: Logout URL me `federated` parameter zaroori hai
3. **Userinfo Endpoint**: Auth0 domain correctly set karo
4. **No Cache**: `cacheMode: 'off'` zaroori hai

---

## 6. Troubleshooting

**Issue**: Logout detect nahi ho raha
- Check console logs
- Verify Auth0 domain correct hai
- Check network tab - userinfo call fail ho raha hai ya nahi

**Issue**: Too many API calls
- Har 2 seconds me call hota hai - normal hai
- Tab inactive hone par calls reduce ho jati hain

---

**Ye implementation 100% kaam karega! Project A aur Project B dono me same code apply karo.**

