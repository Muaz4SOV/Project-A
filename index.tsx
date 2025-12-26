
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

/**
 * SSO CONFIGURATION:
 * Ensure both projects use exactly this domain and clientId.
 */
const auth0Config = {
  domain: "dev-4v4hx3vrjxrwitlc.us.auth0.com", 
  clientId: "zYRUiCf30KOiUnBCELNgek3J4lm11pLR",           
  authorizationParams: {
    redirect_uri: `${window.location.origin}/callback`,
  },
  useRefreshTokens: true,
  cacheLocation: "localstorage" as const
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Auth0Provider {...auth0Config}>
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
