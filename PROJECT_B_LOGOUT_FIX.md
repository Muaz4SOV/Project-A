# Project B - SSO Logout Fix (Complete Solution)

## Problem
Project A se logout karne par Project B me logout nahi ho raha, aur vice versa.

## Solution: Complete SSO Logout Implementation

### 1. Navbar.tsx - Logout Function

Project B ke `components/Navbar.tsx` me ye exact code use karo:

```tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LogIn, LogOut, Layout } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  // Handle logout with SSO (Single Sign-Out)
  // This ensures logout from both Project A and Project B
  const handleLogout = () => {
    const auth0Domain = "dev-4v4hx3vrjxrwitlc.us.auth0.com";
    const clientId = "zYRUiCf30KOiUnBCELNgek3J4lm11pLR";
    const returnTo = window.location.origin;
    
    // Set logout timestamp FIRST - this helps detect logout across tabs
    const logoutTime = Date.now().toString();
    localStorage.setItem('auth0_logout_timestamp', logoutTime);
    
    // Set logout flag in cookie (helps with cross-domain detection)
    document.cookie = `auth0_logout=${logoutTime}; path=/; max-age=600; SameSite=None; Secure`;
    
    // Clear ALL Auth0 cache from localStorage (aggressive cleanup)
    const keysToRemove: string[] = [];
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth0') || 
          key.includes('@@auth0spajs@@') || 
          key.toLowerCase().includes('auth') ||
          key.includes(clientId) ||
          key.includes(auth0Domain.replace(/\./g, '_'))) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear ALL session storage flags and data
    const sessionKeysToRemove: string[] = [];
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('ss_check_') || 
          key.toLowerCase().includes('auth') ||
          key.includes(clientId)) {
        sessionKeysToRemove.push(key);
      }
    });
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    // Clear Auth0 SDK's logout method (local logout)
    logout({
      logoutParams: {
        returnTo: returnTo,
      },
      localOnly: true // Clear local cache immediately
    });
    
    // Immediately redirect to Auth0 logout endpoint for federated logout
    // The 'federated' parameter ensures Auth0 session is cleared server-side
    const logoutUrl = `https://${auth0Domain}/v2/logout?` +
      `client_id=${clientId}&` +
      `returnTo=${encodeURIComponent(returnTo)}&` +
      `federated`; // CRITICAL: This clears Auth0 session server-side
    
    // Redirect immediately to logout endpoint
    window.location.href = logoutUrl;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* ... your navbar JSX ... */}
      <button
        onClick={handleLogout}  // Use handleLogout
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <LogOut size={16} />
        <span>Sign Out</span>
      </button>
      {/* ... */}
    </nav>
  );
};

export default Navbar;
```

### 2. App.tsx - Session Validation & Silent Login Check

Project B ke `App.tsx` me ye code add/update karo. Main parts:

#### a) Session Validation Effect (Authenticated users ke liye)

```tsx
// Session validation - checks if Auth0 session is still valid
useEffect(() => {
  if (!isAuthenticated || isCallbackRoute) {
    return;
  }

  // Check for logout timestamp from another tab/window/app
  const checkLogoutTimestamp = () => {
    // Check localStorage (works for same domain tabs)
    const logoutTimestamp = localStorage.getItem('auth0_logout_timestamp');
    
    // Check cookie (works across different domains if set properly)
    const logoutCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth0_logout='));
    
    const cookieLogoutTime = logoutCookie ? parseInt(logoutCookie.split('=')[1]) : null;
    const storageLogoutTime = logoutTimestamp ? parseInt(logoutTimestamp) : null;
    
    // Get the most recent logout time from either source
    let logoutTime: number | null = null;
    if (storageLogoutTime) logoutTime = storageLogoutTime;
    if (cookieLogoutTime && (!logoutTime || cookieLogoutTime > logoutTime)) {
      logoutTime = cookieLogoutTime;
    }
    
    if (logoutTime) {
      const lastCheck = localStorage.getItem('auth0_last_session_check');
      
      // If logout happened after our last check, we need to logout
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
    // Clear all Auth0 cache
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
    
    // Reload page to trigger logout state
    window.location.reload();
  };

  // Validate session function
  const validateSession = async () => {
    if (checkLogoutTimestamp()) {
      return;
    }

    localStorage.setItem('auth0_last_session_check', Date.now().toString());

    try {
      // Force fresh token check - if session cleared, this will fail
      await getAccessTokenSilently({
        cacheMode: 'off',
        timeoutInSeconds: 2,
        authorizationParams: {
          prompt: 'none'
        }
      });
    } catch (error: any) {
      // Session invalid - logout
      if (error?.error === 'login_required' || 
          error?.error === 'invalid_grant' ||
          error?.message?.includes('login_required')) {
        console.log("Session cleared - performing logout");
        performLogout();
      }
    }
  };

  // Check every 3 seconds
  const interval = setInterval(() => {
    if (!checkLogoutTimestamp()) {
      validateSession();
    }
  }, 3000);

  // Also check on visibility/focus
  const handleVisibilityChange = () => {
    if (!document.hidden && isAuthenticated) {
      validateSession();
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth0_logout_timestamp' && e.newValue) {
      performLogout();
    }
  });

  return () => {
    clearInterval(interval);
    window.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [isAuthenticated, isCallbackRoute, getAccessTokenSilently]);
```

#### b) Silent Login Check (Update karo)

Silent login check me logout timestamp check add karo:

```tsx
// Before silent login attempt, check logout timestamp
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
  const now = Date.now();
  const timeDiff = now - logoutTime;
  
  // If logout happened in last 10 minutes, skip silent login
  if (timeDiff < 10 * 60 * 1000) {
    console.log("Logout detected - skipping silent login");
    setIsCheckingSso(false);
    return;
  }
}
```

### 3. Key Points

1. **Federated Logout**: `federated` parameter Auth0 session server-side clear karta hai
2. **Session Validation**: Har 3 seconds me Auth0 session check hota hai
3. **Logout Detection**: localStorage + cookie dono check hote hain
4. **Token Validation**: `cacheMode: 'off'` se fresh token check hota hai
5. **Cross-Tab**: Storage events cross-tab logout detect karte hain

### 4. Testing

1. Dono projects me login karo
2. Project A se logout karo
3. Project B me refresh karo ya tab switch karo
4. Project B automatically logout ho jana chahiye (within 3-5 seconds)

**Important**: Project A aur Project B dono me **exact same code** use karo!

