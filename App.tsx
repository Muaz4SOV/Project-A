
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const [isCheckingSso, setIsCheckingSso] = useState(true);

  // AUTOMATIC SSO DETECTION:
  // If not authenticated, we try a silent login in the background.
  useEffect(() => {
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
      } else if (!isLoading) {
        setIsCheckingSso(false);
      }
    };

    checkSso();
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading || isCheckingSso) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-center p-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-bold text-xl tracking-tight">Syncing your Account...</p>
        <p className="text-gray-400 text-sm mt-2">Checking Single Sign-On session across apps.</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
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
      </div>
    </BrowserRouter>
  );
};

export default App;
