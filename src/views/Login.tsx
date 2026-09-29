import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  Zap,
  Calendar,
  TrendingUp,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { signInWithGoogle, signInDemoUser, error, clearError } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    clearError();
    try {
      await signInWithGoogle();
    } catch {
      // Handled in context
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoadingDemo(true);
    clearError();
    try {
      await signInDemoUser();
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121214] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background ambient automotive light cones */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-[#FF6B00]/10 via-[#FF5500]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#FF6B00]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B00] via-[#FF5500] to-[#D63A00] shadow-xl shadow-orange-600/30 mb-5 ring-4 ring-[#FF6B00]/20 animate-in zoom-in-95">
            <Flame className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wider uppercase">
            <span>Fox</span> <span className="text-[#FF6B00]">Detailer</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400 font-medium">
            Gestão Inteligente para Estética Automotiva
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1A1A1E] border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Falha na autenticação</p>
                <p className="mt-0.5 text-zinc-400">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Google Sign-in Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle || loadingDemo}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 active:scale-[0.98] transition shadow-lg shadow-white/5 cursor-pointer disabled:opacity-60"
            >
              {loadingGoogle ? (
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Entrar com o Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-zinc-800" />
              <span className="px-3 text-xs uppercase font-medium text-zinc-400">ou</span>
              <div className="flex-1 border-t border-zinc-800" />
            </div>

            {/* Sandbox / Demo Login */}
            <button
              onClick={handleDemoLogin}
              disabled={loadingGoogle || loadingDemo}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-sm border border-zinc-700/60 active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
            >
              {loadingDemo ? (
                <div className="w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-[#FF6B00]" />
              )}
              <span>Acessar Modo Demonstração</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Autenticação segura via Firebase Auth</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <Calendar className="w-4 h-4 text-[#FF6B00] mb-1.5" />
            <p className="text-xs font-semibold text-white">Agendamentos</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Controle de serviços pendentes e executados
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <TrendingUp className="w-4 h-4 text-emerald-400 mb-1.5" />
            <p className="text-xs font-semibold text-white">Fluxo de Caixa</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Receitas, despesas e lucro líquido mensal
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <Smartphone className="w-4 h-4 text-blue-400 mb-1.5" />
            <p className="text-xs font-semibold text-white">Suporte PWA</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Instale direto na tela inicial do celular
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <Zap className="w-4 h-4 text-amber-400 mb-1.5" />
            <p className="text-xs font-semibold text-white">Tempo Real</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Sincronização instantânea no Cloud Firestore
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
