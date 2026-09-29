import React, { useState } from 'react';
import {
  Settings,
  Flame,
  Smartphone,
  Database,
  LogOut,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { seedInitialAppointments } from '../services/appointmentService';
import { seedInitialTransactions } from '../services/financeService';
import { seedInitialClients } from '../services/clientService';
import { testConnection, firebaseConfig } from '../firebase';

export const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const [testingDb, setTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbStatus(null);
    try {
      const ok = await testConnection();
      setDbStatus(ok ? 'Conexão com Cloud Firestore ativa e respondendo!' : 'Conexão offline ou pendente.');
    } catch {
      setDbStatus('Erro ao testar Firestore.');
    } finally {
      setTestingDb(false);
    }
  };

  const handleSeedAll = async () => {
    if (!user) return;
    setSeeding(true);
    setSeedSuccess(false);
    try {
      await Promise.all([
        seedInitialAppointments(user.uid),
        seedInitialTransactions(user.uid),
        seedInitialClients(user.uid),
      ]);
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
    } catch (err) {
      console.error('Error seeding data:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#FF6B00]" />
          <span>Configurações & Sistema</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Parâmetros do Fox Detailer, PWA e conectividade do Cloud Firestore
        </p>
      </div>

      {/* Detailer Shop Profile */}
      <div className="p-6 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#CC4400] flex items-center justify-center shadow-lg shadow-orange-600/30">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Fox Detailer Pro</h3>
            <p className="text-xs text-zinc-400">Versão 1.0.0 • Gestão de Estética Automotiva</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              Produção Ativa
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-zinc-500">Usuário Operador:</span>
            <p className="font-semibold text-white mt-0.5">{user?.displayName || 'Operador Fox'}</p>
          </div>
          <div>
            <span className="text-zinc-500">E-mail Cadastrado:</span>
            <p className="font-semibold text-white mt-0.5">{user?.email || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* PWA Section */}
      <div className="p-6 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Aplicativo PWA Móvel</h3>
              <p className="text-xs text-zinc-400">
                Instale este web app no seu celular ou computador sem precisar de loja de aplicativos
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 space-y-2">
          <p>
            O Fox Detailer funciona com suporte a <strong>Progressive Web App (PWA)</strong>, permitindo abertura instantânea em tela cheia, ícone próprio e funcionamento rápido com cache.
          </p>
          <div className="pt-2">
            <PWAInstallButton variant="full" />
          </div>
        </div>
      </div>

      {/* Firebase & Cloud Firestore Section */}
      <div className="p-6 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cloud Firestore Ativo</h3>
              <p className="text-xs text-zinc-400">Banco de dados NoSQL persistente em tempo real</p>
            </div>
          </div>

          <button
            onClick={handleTestDatabase}
            disabled={testingDb}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
            <span>Testar Conexão</span>
          </button>
        </div>

        {dbStatus && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{dbStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
          <div>
            <span className="text-zinc-500">Firebase Project ID:</span>
            <p className="font-mono text-zinc-300">{firebaseConfig.projectId}</p>
          </div>
          <div>
            <span className="text-zinc-500">Auth Domain:</span>
            <p className="font-mono text-zinc-300 truncate">{firebaseConfig.authDomain}</p>
          </div>
        </div>

        {/* Demo Seed Section */}
        <div className="pt-2">
          <button
            onClick={handleSeedAll}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition cursor-pointer"
          >
            {seeding ? (
              <div className="w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 text-[#FF6B00]" />
            )}
            <span>Carregar Dados Demonstrativos (Agendamentos, Finanças, Clientes)</span>
          </button>
          {seedSuccess && (
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dados inseridos com sucesso no Firestore!</span>
            </p>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="p-6 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">Encerrar Sessão</h4>
          <p className="text-xs text-zinc-400">Desconectar do dispositivo atual</p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
};
