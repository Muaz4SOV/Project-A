
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
    // Note: localStorage doesn't share across different domains, but helps with same-domain tabs
    const logoutTime = Date.now().toString();
    localStorage.setItem('auth0_logout_timestamp', logoutTime);
    
    // Set logout flag in a way that can be checked via cookies (works across subdomains)
    // We'll use a cookie with domain that works for both apps
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
    // This will prevent silent login from working on other apps
    const logoutUrl = `https://${auth0Domain}/v2/logout?` +
      `client_id=${clientId}&` +
      `returnTo=${encodeURIComponent(returnTo)}&` +
      `federated`; // CRITICAL: This clears Auth0 session server-side
    
    // Redirect immediately to logout endpoint
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
                  // Clear ALL flags and timestamps when user manually clicks Sign In
                  // This ensures clean login without any blocking
                  localStorage.removeItem('auth0_logout_timestamp');
                  localStorage.removeItem('auth0_last_session_check');
                  document.cookie = 'auth0_logout=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                  
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
