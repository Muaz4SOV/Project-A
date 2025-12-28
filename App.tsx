
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';
import { useLogoutSignalR } from './hooks/useLogoutSignalR';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const [isCheckingSso, setIsCheckingSso] = useState(true);
  const location = useLocation();
  const isCallbackRoute = location.pathname === '/callback';

  // Initialize SignalR logout listener for global logout
  useLogoutSignalR();

  // REMOVED: Session validation useEffect
  // SignalR handles all logout events in real-time
  // No need for timestamp checking or storage events

  // AUTOMATIC SSO DETECTION:
  // If not authenticated, we try a silent login in the background.
  // Skip SSO check if we're on callback route (Auth0 is handling it)
  useEffect(() => {
    // If on callback route, don't do SSO check - let Auth0 handle callback
    if (isCallbackRoute) {
      setIsCheckingSso(false);
      return;
    }

    // REMOVED: Storage event listener for logout timestamp
    // SignalR handles all logout events, so no need for timestamp tracking

    const checkSso = async () => {
      // Wait for Auth0 to initialize
      if (isLoading) {
        return;
      }

      // If already authenticated, skip SSO check
      if (isAuthenticated) {
        const originFlag = `ss_check_${window.location.origin}`;
        sessionStorage.removeItem(originFlag);
        setIsCheckingSso(false);
        return;
      }

      // REMOVED: Logout timestamp check from silent login
      // SignalR handles logout events, so we don't need to block silent login
      // Allow silent login to proceed - if session exists, user will be logged in
      // If session doesn't exist, silent login will fail gracefully

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
          // This is normal - user needs to click Sign In button for manual login
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

  }, [isLoading, isAuthenticated, loginWithRedirect, isCallbackRoute]);

  // Handle callback route - wait for Auth0 to process and redirect
  useEffect(() => {
    if (isCallbackRoute && !isLoading && isAuthenticated) {
      // Clear SSO check flag after successful callback
      const originFlag = `ss_check_${window.location.origin}`;
      sessionStorage.removeItem(originFlag);
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
