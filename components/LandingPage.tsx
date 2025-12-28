import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LogIn } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to AppNexus
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sign in to continue
        </p>
        <button
          onClick={() => loginWithRedirect()}
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 shadow-lg transition-all active:scale-95 mx-auto"
        >
          <LogIn size={20} />
          <span>Sign In</span>
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
