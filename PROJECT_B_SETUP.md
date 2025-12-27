# Project B - Silent Login & Auto Redirect Fix

## Problem
Project B me silent login hone ke baad automatically Dashboard par redirect nahi ho raha.

## Solution

Project B me same code apply karna hai jo Project A me hai. Yani:

### 1. App.tsx File me ye changes:

```tsx
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const [isCheckingSso, setIsCheckingSso] = useState(true);
  const location = useLocation();
  const isCallbackRoute = location.pathname === '/callback';

  // AUTOMATIC SSO DETECTION:
  // If not authenticated, we try a silent login in the background.
  // Skip SSO check if we're on callback route (Auth0 is handling it)
  useEffect(() => {
    // If on callback route, don't do SSO check - let Auth0 handle callback
    if (isCallbackRoute) {
      setIsCheckingSso(false);
      return;
    }

    const checkSso = async () => {
      if (!isLoading && !isAuthenticated) {
        // Prevent infinite loops by checking if we already tried this session
        const triedSilent = sessionStorage.getItem('ss_check_performed');
        
        if (!triedSilent) {
          sessionStorage.setItem('ss_check_performed', 'true');
          try {
            await loginWithRedirect({
              authorizationParams: {
                prompt: 'none', // This checks Auth0 session without showing any UI
              }
            });
          } catch (e) {
            console.log("Silent SSO check failed or interaction required.", e);
            setIsCheckingSso(false);
          }
        } else {
          setIsCheckingSso(false);
        }
      } else if (!isLoading && isAuthenticated) {
        // Clear the SSO check flag if authenticated
        sessionStorage.removeItem('ss_check_performed');
        setIsCheckingSso(false);
      } else if (!isLoading) {
        setIsCheckingSso(false);
      }
    };

    checkSso();
  }, [isLoading, isAuthenticated, loginWithRedirect, isCallbackRoute]);

  // Handle callback route - wait for Auth0 to process and redirect
  useEffect(() => {
    if (isCallbackRoute && !isLoading && isAuthenticated) {
      // Clear SSO check flag after successful callback
      sessionStorage.removeItem('ss_check_performed');
    }
  }, [isCallbackRoute, isLoading, isAuthenticated]);

  // Show loading only if not on callback route (callback route handles its own loading)
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
```

### 2. Important Points:

1. **Callback Route Handling**: Callback route par SSO check skip karna hai
2. **Wait for Auth0**: Callback route par `isLoading` true hone tak wait karna hai
3. **Auto Redirect**: Jab `isAuthenticated` true ho jaye, automatically `/dashboard` par redirect
4. **Session Storage**: Successful callback ke baad `ss_check_performed` flag clear karna hai

### 3. vercel.json File

Ensure karein ke Project B me bhi `vercel.json` file hai:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4. Testing

1. Project A se "Go to Project B" button click karein
2. Auth0 silent login hoga
3. Callback route par redirect hoga
4. Loading screen dikhega
5. Automatic `/dashboard` par redirect ho jayega

## Key Changes Explained

- **AppContent Component**: Router ke andar useLocation hook use kiya
- **Callback Route Check**: `/callback` route par SSO check skip kiya
- **Better Loading State**: Callback route apna loading state handle karta hai
- **Session Cleanup**: Successful authentication ke baad flags clear kiye

Ye changes apply karne ke baad Project B me bhi silent login ke baad automatic dashboard redirect ho jayega!

