
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const [isCheckingSso, setIsCheckingSso] = useState(true);
  const location = useLocation();
  const isCallbackRoute = location.pathname === '/callback';

  // Session validation - checks if Auth0 session is still valid
  // This ensures logout from one app is detected by other app
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
      
      // Get the most recent logout time from either source
      let logoutTime: number | null = null;
      if (logoutTimestamp) {
        logoutTime = parseInt(logoutTimestamp);
      }
      if (cookieLogoutTime && (!logoutTime || cookieLogoutTime > logoutTime)) {
        logoutTime = cookieLogoutTime;
      }
      
      if (logoutTime) {
        const lastCheck = localStorage.getItem('auth0_last_session_check');
        
        // If logout happened after our last check, we need to logout
        if (!lastCheck || parseInt(lastCheck) < logoutTime) {
          console.log("Logout detected from another app - logging out", {
            logoutTime,
            lastCheck: lastCheck ? parseInt(lastCheck) : null
          });
          performLogout();
          return true;
        }
      }
      return false;
    };

    // Perform logout cleanup
    const performLogout = () => {
      // Clear all Auth0 cache from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth0') || 
            key.includes('@@auth0spajs@@') || 
            key.toLowerCase().includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear session storage flags
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('ss_check_') || 
            key.toLowerCase().includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Reload page to trigger logout state
      window.location.reload();
    };

    // Validate session function - checks if Auth0 session is still valid
    const validateSession = async () => {
      // First check if logout happened in another tab/app
      if (checkLogoutTimestamp()) {
        return;
      }

      // Update last check timestamp
      const checkTime = Date.now();
      localStorage.setItem('auth0_last_session_check', checkTime.toString());

      try {
        // Try to get access token silently with NO cache
        // This forces Auth0 to check the server-side session
        // If federated logout cleared the session, this will fail
        await getAccessTokenSilently({
          cacheMode: 'off', // Force fresh token check - bypasses ALL cache
          timeoutInSeconds: 2, // Shorter timeout for faster detection
          authorizationParams: {
            prompt: 'none' // Silent check - no UI
          }
        });
        
        // If we got here, token is valid - check logout timestamp again after a moment
        // to ensure logout didn't happen during the token check
        setTimeout(() => {
          if (checkLogoutTimestamp()) {
            return;
          }
        }, 500);
        
      } catch (error: any) {
        // Token refresh failed - session is invalid
        // This happens when:
        // 1. User logged out from another app (federated logout cleared Auth0 session)
        // 2. Auth0 session expired
        // 3. Network error (but we'll still logout to be safe)
        console.log("Session validation failed - Auth0 session invalid", error);
        
        // Double-check logout timestamp before logging out
        if (!checkLogoutTimestamp()) {
          // If no logout timestamp, it might be a network error
          // But if error is specifically login_required, it means session is cleared
          if (error?.error === 'login_required' || 
              error?.error === 'invalid_grant' ||
              error?.message?.includes('login_required') ||
              error?.message?.includes('invalid_grant')) {
            console.log("Session cleared by logout - performing logout");
            performLogout();
          }
        }
      }
    };

    // Check when page becomes visible (user switches back to this tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        validateSession();
      }
    };

    // Check when window gets focus
    const handleFocus = () => {
      if (isAuthenticated) {
        validateSession();
      }
    };

    // Listen for storage changes (cross-tab communication)
    // When logout happens in another tab, localStorage changes and triggers this
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth0_logout_timestamp' && e.newValue) {
        console.log("Logout detected via storage event from another tab");
        performLogout();
      }
    };

    // Immediate check for logout timestamp
    if (checkLogoutTimestamp()) {
      return;
    }

    // Initial check after 1 second
    const initialTimer = setTimeout(validateSession, 1000);
    
    // Periodic check every 3 seconds (for faster logout detection)
    const interval = setInterval(() => {
      if (!checkLogoutTimestamp()) {
        validateSession();
      }
    }, 3000);

    // Add event listeners
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

  // AUTOMATIC SSO DETECTION:
  // If not authenticated, we try a silent login in the background.
  // Skip SSO check if we're on callback route (Auth0 is handling it)
  useEffect(() => {
    // If on callback route, don't do SSO check - let Auth0 handle callback
    if (isCallbackRoute) {
      setIsCheckingSso(false);
      return;
    }

    // Listen for logout events from other tabs/apps
    const handleLogoutStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth0_logout_timestamp' && e.newValue) {
        console.log("Logout detected in SSO check via storage event - skipping silent login");
        setIsCheckingSso(false);
      }
    };
    
    window.addEventListener('storage', handleLogoutStorageChange);

    const checkSso = async () => {
      // Wait for Auth0 to initialize
      if (isLoading) {
        return;
      }

      // If already authenticated, we still need to validate session
      // But skip initial SSO check (periodic validation will handle it)
      if (isAuthenticated) {
        const originFlag = `ss_check_${window.location.origin}`;
        sessionStorage.removeItem(originFlag);
        setIsCheckingSso(false);
        
        // Clear logout timestamp if user is authenticated (they logged back in)
        localStorage.removeItem('auth0_logout_timestamp');
        return;
      }

      // Check if logout happened recently - if yes, skip silent login
      // Check both localStorage and cookies
      const logoutTimestamp = localStorage.getItem('auth0_logout_timestamp');
      const logoutCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth0_logout='));
      
      const cookieLogoutTime = logoutCookie ? parseInt(logoutCookie.split('=')[1]) : null;
      const storageLogoutTime = logoutTimestamp ? parseInt(logoutTimestamp) : null;
      
      // Get the most recent logout time
      let logoutTime: number | null = null;
      if (storageLogoutTime) logoutTime = storageLogoutTime;
      if (cookieLogoutTime && (!logoutTime || cookieLogoutTime > logoutTime)) {
        logoutTime = cookieLogoutTime;
      }
      
      if (logoutTime) {
        const now = Date.now();
        const timeDiff = now - logoutTime;
        
        // If logout timestamp is older than 10 minutes, clear it (user can login again)
        if (timeDiff > 10 * 60 * 1000) {
          localStorage.removeItem('auth0_logout_timestamp');
          document.cookie = 'auth0_logout=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } 
        // If logout happened in last 10 minutes, skip silent login
        else if (timeDiff < 10 * 60 * 1000) {
          console.log("Logout detected - skipping silent login to prevent re-authentication", {
            logoutTime,
            timeDiff: Math.round(timeDiff / 1000) + ' seconds ago'
          });
          setIsCheckingSso(false);
          return;
        }
      }

      // Use origin-based flag instead of global flag (allows check per domain)
      const originFlag = `ss_check_${window.location.origin}`;
      const triedSilent = sessionStorage.getItem(originFlag);
      
      if (!triedSilent) {
        sessionStorage.setItem(originFlag, 'true');
        
        try {
          // Silent login attempt - this will redirect to callback if session exists
          await loginWithRedirect({
            authorizationParams: {
              prompt: 'none', // Silent login - no UI shown
            },
            appState: {
              returnTo: '/dashboard'
            }
          });
          // If loginWithRedirect succeeds, we'll be redirected to callback
          // So we don't need to set isCheckingSso to false here
        } catch (e: any) {
          // Silent login failed - either no session or user interaction needed
          console.log("Silent SSO check failed or interaction required.", e);
          setIsCheckingSso(false);
          // Clear the flag on error so user can retry by refreshing
          sessionStorage.removeItem(originFlag);
        }
      } else {
        setIsCheckingSso(false);
      }
    };

    // Run check immediately if Auth0 is already initialized, otherwise wait
    if (!isLoading) {
      checkSso();
    } else {
      // Wait for Auth0 to initialize
      const timer = setTimeout(() => {
        checkSso();
      }, 50);

      return () => clearTimeout(timer);
    }

    // Cleanup storage listener
    return () => {
      window.removeEventListener('storage', handleLogoutStorageChange);
    };
  }, [isLoading, isAuthenticated, loginWithRedirect, isCallbackRoute]);

  // Handle callback route - wait for Auth0 to process and redirect
  useEffect(() => {
    if (isCallbackRoute && !isLoading && isAuthenticated) {
      // Clear SSO check flag after successful callback
      const originFlag = `ss_check_${window.location.origin}`;
      sessionStorage.removeItem(originFlag);
      
      // Clear logout timestamp after successful login (so user can login again)
      localStorage.removeItem('auth0_logout_timestamp');
      localStorage.removeItem('auth0_last_session_check');
    }
  }, [isCallbackRoute, isLoading, isAuthenticated]);

  // Show loading screen while:
  // 1. Auth0 is initializing (isLoading)
  // 2. We're checking for SSO (isCheckingSso)
  // 3. We're not on callback route (callback has its own loading)
  // This ensures silent login check completes before showing landing page
  if ((isLoading || isCheckingSso) && !isCallbackRoute) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-center p-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-bold text-xl tracking-tight">Syncing your Account...</p>
        <p className="text-gray-400 text-sm mt-2">Checking Single Sign-On session across apps.</p>
      </div>
    );
  }

  return (
    <>
      {!isCallbackRoute && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
            } 
          />

          <Route 
            path="/callback" 
            element={
              isLoading ? (
                <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-center p-4">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600 font-bold text-xl tracking-tight">Completing sign in...</p>
                  <p className="text-gray-400 text-sm mt-2">Please wait while we authenticate you.</p>
                </div>
              ) : isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AppContent />
      </div>
    </BrowserRouter>
  );
};

export default App;
