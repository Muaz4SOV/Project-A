
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
    
    // Clear Auth0 cache from localStorage (same key used by Auth0 React SDK)
    // This clears the local session immediately
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth0') || key.includes('@@auth0spajs@@')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear session storage flags
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('ss_check_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Use Auth0's logout endpoint with federated logout
    // This clears the Auth0 session centrally, which will logout from all apps
    const logoutUrl = `https://${auth0Domain}/v2/logout?` +
      `client_id=${clientId}&` +
      `returnTo=${encodeURIComponent(returnTo)}&` +
      `federated`; // Enables federated logout (clears Auth0 session)
    
    // Redirect to Auth0 logout endpoint
    // This will clear the Auth0 session and redirect back
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
                onClick={() => loginWithRedirect()}
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
