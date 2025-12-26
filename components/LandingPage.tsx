
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-[1.1]">
          Seamless Identity <br />
          <span className="text-blue-600">Unified Access.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed">
          Experience true Single Sign-On. Log in once and access all your connected applications without friction or repeated prompts.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
          <button
            onClick={() => loginWithRedirect()}
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl active:scale-95"
          >
            Get Started Now
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:border-gray-200 hover:bg-gray-50 transition-all">
            Learn More
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Auth0 Secured</h3>
            <p className="text-gray-600">Enterprise-grade security protecting your identity across the entire ecosystem.</p>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Instant SSO</h3>
            <p className="text-gray-600">Switch between apps instantly. No need to re-enter credentials once you're in.</p>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Global Context</h3>
            <p className="text-gray-600">Your preferences and profile follow you wherever you go within our network.</p>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-6xl h-full opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default LandingPage;
