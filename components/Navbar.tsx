
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LogIn, LogOut, Layout, ArrowRight } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  // Function to redirect to Project B with silent login
  const redirectToProjectB = () => {
    const auth0Domain = "dev-4v4hx3vrjxrwitlc.us.auth0.com";
    const clientId = "zYRUiCf30KOiUnBCELNgek3J4lm11pLR";
    const projectBUrl = "https://project-b-git-main-muhammad-muazs-projects-cc9bdaf8.vercel.app";
    const redirectUri = `${projectBUrl}/callback`;
    
    // Generate a random state for security
    const state = btoa(JSON.stringify({ 
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(7)
    })).replace(/[+/=]/g, '');

    // Construct Auth0 authorization URL with silent login (prompt: none)
    const authUrl = `https://${auth0Domain}/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=openid profile email offline_access&` +
      `prompt=none&` +
      `state=${state}`;

    // Redirect to Project B with silent login
    window.location.href = authUrl;
  };

  // Handle logout with SSO (Single Sign-Out)
  // SignalR handles global logout, so no need for timestamp tracking
  const handleLogout = () => {
    const auth0Domain = "dev-4v4hx3vrjxrwitlc.us.auth0.com";
    const clientId = "zYRUiCf30KOiUnBCELNgek3J4lm11pLR";
    const returnTo = window.location.origin;
    
    // Clear ALL Auth0 cache from localStorage
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
    
    // Redirect to Auth0 logout endpoint for federated logout
    // Back-Channel Logout will notify backend → SignalR → All apps
    const logoutUrl = `https://${auth0Domain}/v2/logout?` +
      `client_id=${clientId}&` +
      `returnTo=${encodeURIComponent(returnTo)}&` +
      `federated`; // This triggers Back-Channel Logout → Backend → SignalR
    
    // Redirect to logout endpoint
    window.location.href = logoutUrl;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Layout size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">AppNexus</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={redirectToProjectB}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <span>Go to Project B</span>
                  <ArrowRight size={16} />
                </button>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-900 leading-none">{user?.name}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  // Clear session storage flags that might block login
                  Object.keys(sessionStorage).forEach(key => {
                    if (key.startsWith('ss_check_')) {
                      sessionStorage.removeItem(key);
                    }
                  });
                  
                  // Proceed with manual login
                  loginWithRedirect();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all active:scale-95"
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
