import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './views/Login';
import { Layout } from './components/layout/Layout';
import { Flame } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center relative overflow-hidden select-none">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B00] via-[#FF5500] to-[#CC4400] flex items-center justify-center shadow-2xl shadow-orange-600/40 animate-pulse">
          <Flame className="w-9 h-9 text-white" />
        </div>
        <h2 className="mt-4 text-base font-black text-white tracking-widest uppercase">
          Fox <span className="text-[#FF6B00]">Detailer</span>
        </h2>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Layout />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
