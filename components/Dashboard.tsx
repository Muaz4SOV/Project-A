
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { User, Mail, Shield, CheckCircle2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth0();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32 relative">
          <div className="absolute -bottom-12 left-8 border-4 border-white rounded-2xl overflow-hidden shadow-lg bg-white">
            <img 
              src={user?.picture || 'https://picsum.photos/100/100'} 
              alt={user?.name} 
              className="w-24 h-24 object-cover"
            />
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500 font-medium">{user?.nickname || 'Professional User'}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100">
              <CheckCircle2 size={16} />
              Authenticated Session
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">User Details</h3>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Mail className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Email Address</p>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <User className="text-gray-400" size={20} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Username</p>
                  <p className="text-gray-900 font-medium">{user?.preferred_username || user?.nickname || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Security Stats</h3>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Shield className="text-blue-500" size={20} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Verification Status</p>
                  <p className="text-gray-900 font-medium">{user?.email_verified ? 'Verified Email' : 'Pending Verification'}</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-blue-800 font-semibold mb-1">SSO Active</p>
                <p className="text-sm text-blue-600/80 leading-snug">
                  You can now visit any linked application in our network and you will be logged in automatically!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400 italic">Auth0 Session ID: {user?.sub?.split('|')[1].substring(0, 10)}...</span>
          <button className="text-sm text-blue-600 font-bold hover:underline">Download Security Audit</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
