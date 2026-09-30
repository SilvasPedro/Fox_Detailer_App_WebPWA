import React, { useState } from 'react';
import {
  Settings,
  Flame,
  Smartphone,
  Database,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Code,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { testConnection, firebaseConfig } from '../firebase';

const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    match /test/{testId} {
      allow get: if true;
      allow write: if false;
    }

    function isValidAppointment(data) {
      return data.keys().hasAll(['userId', 'clientName', 'vehicleModel', 'serviceType', 'price', 'scheduledDate', 'status'])
        && data.keys().toSet().isSubset(['userId', 'clientName', 'clientPhone', 'vehicleModel', 'vehiclePlate', 'serviceType', 'serviceIds', 'subtotal', 'discount', 'price', 'scheduledDate', 'status', 'notes', 'createdAt', 'updatedAt'].toSet())
        && data.userId == request.auth.uid
        && data.clientName is string && data.clientName.size() > 0 && data.clientName.size() <= 100
        && (!('clientPhone' in data) || (data.clientPhone is string && data.clientPhone.size() <= 30))
        && data.vehicleModel is string && data.vehicleModel.size() > 0 && data.vehicleModel.size() <= 100
        && (!('vehiclePlate' in data) || (data.vehiclePlate is string && data.vehiclePlate.size() <= 15))
        && data.serviceType is string && data.serviceType.size() > 0 && data.serviceType.size() <= 200
        && (!('serviceIds' in data) || (data.serviceIds is list && data.serviceIds.size() <= 30))
        && (!('subtotal' in data) || ((data.subtotal is number || data.subtotal is int) && data.subtotal >= 0))
        && (!('discount' in data) || ((data.discount is number || data.discount is int) && data.discount >= 0))
        && (data.price is number || data.price is int) && data.price >= 0
        && data.scheduledDate is string && data.scheduledDate.size() <= 40
        && data.status in ['pending', 'in_progress', 'completed', 'cancelled']
        && (!('notes' in data) || (data.notes is string && data.notes.size() <= 500))
        && (!('createdAt' in data) || (data.createdAt is string && data.createdAt.size() <= 40))
        && (!('updatedAt' in data) || (data.updatedAt is string && data.updatedAt.size() <= 40));
    }

    match /appointments/{appointmentId} {
      allow get: if isSignedIn() && isValidId(appointmentId) && existing().userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && isValidId(appointmentId) && isValidAppointment(incoming());
      allow update: if isSignedIn() && isValidId(appointmentId) && existing().userId == request.auth.uid && isValidAppointment(incoming()) && incoming().userId == existing().userId;
      allow delete: if isSignedIn() && isValidId(appointmentId) && existing().userId == request.auth.uid;
    }

    function isValidService(data) {
      return data.keys().hasAll(['userId', 'name', 'price', 'duration'])
        && data.keys().toSet().isSubset(['userId', 'name', 'price', 'duration', 'description', 'createdAt', 'updatedAt'].toSet())
        && data.userId == request.auth.uid
        && data.name is string && data.name.size() > 0 && data.name.size() <= 100
        && (data.price is number || data.price is int) && data.price >= 0
        && data.duration is string && data.duration.size() > 0 && data.duration.size() <= 60
        && (!('description' in data) || (data.description is string && data.description.size() <= 300))
        && (!('createdAt' in data) || (data.createdAt is string && data.createdAt.size() <= 40))
        && (!('updatedAt' in data) || (data.updatedAt is string && data.updatedAt.size() <= 40));
    }

    match /services/{serviceId} {
      allow get: if isSignedIn() && isValidId(serviceId) && existing().userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && isValidId(serviceId) && isValidService(incoming());
      allow update: if isSignedIn() && isValidId(serviceId) && existing().userId == request.auth.uid && isValidService(incoming()) && incoming().userId == existing().userId;
      allow delete: if isSignedIn() && isValidId(serviceId) && existing().userId == request.auth.uid;
    }

    function isValidTransaction(data) {
      return data.keys().hasAll(['userId', 'type', 'amount', 'category', 'description', 'date', 'status'])
        && data.keys().toSet().isSubset(['userId', 'type', 'amount', 'category', 'description', 'date', 'status', 'appointmentId', 'createdAt', 'updatedAt'].toSet())
        && data.userId == request.auth.uid
        && data.type in ['income', 'expense']
        && (data.amount is number || data.amount is int) && data.amount >= 0
        && data.category is string && data.category.size() > 0 && data.category.size() <= 60
        && data.description is string && data.description.size() <= 200
        && data.date is string && data.date.size() <= 40
        && data.status in ['paid', 'pending']
        && (!('appointmentId' in data) || (data.appointmentId is string && data.appointmentId.size() <= 128))
        && (!('createdAt' in data) || (data.createdAt is string && data.createdAt.size() <= 40))
        && (!('updatedAt' in data) || (data.updatedAt is string && data.updatedAt.size() <= 40));
    }

    match /financial_transactions/{transactionId} {
      allow get: if isSignedIn() && isValidId(transactionId) && existing().userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && isValidId(transactionId) && isValidTransaction(incoming());
      allow update: if isSignedIn() && isValidId(transactionId) && existing().userId == request.auth.uid && isValidTransaction(incoming()) && incoming().userId == existing().userId;
      allow delete: if isSignedIn() && isValidId(transactionId) && existing().userId == request.auth.uid;
    }

    function isValidClient(data) {
      return data.keys().hasAll(['userId', 'name', 'phone', 'vehicleModel'])
        && data.keys().toSet().isSubset(['userId', 'name', 'phone', 'secondaryPhone', 'email', 'vehicleModel', 'vehicles', 'vehiclePlate', 'createdAt', 'updatedAt'].toSet())
        && data.userId == request.auth.uid
        && data.name is string && data.name.size() > 0 && data.name.size() <= 100
        && data.phone is string && data.phone.size() <= 30
        && (!('secondaryPhone' in data) || (data.secondaryPhone is string && data.secondaryPhone.size() <= 30))
        && (!('email' in data) || (data.email is string && data.email.size() <= 100))
        && data.vehicleModel is string && data.vehicleModel.size() <= 100
        && (!('vehicles' in data) || (data.vehicles is list && data.vehicles.size() <= 20))
        && (!('vehiclePlate' in data) || (data.vehiclePlate is string && data.vehiclePlate.size() <= 15))
        && (!('createdAt' in data) || (data.createdAt is string && data.createdAt.size() <= 40))
        && (!('updatedAt' in data) || (data.updatedAt is string && data.updatedAt.size() <= 40));
    }

    match /clients/{clientId} {
      allow get: if isSignedIn() && isValidId(clientId) && existing().userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && isValidId(clientId) && isValidClient(incoming());
      allow update: if isSignedIn() && isValidId(clientId) && existing().userId == request.auth.uid && isValidClient(incoming()) && incoming().userId == existing().userId;
      allow delete: if isSignedIn() && isValidId(clientId) && existing().userId == request.auth.uid;
    }
  }
}`;

export const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const [testingDb, setTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);
  const [showRulesCode, setShowRulesCode] = useState(false);

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbStatus(null);
    try {
      const ok = await testConnection();
      setDbStatus(
        ok
          ? 'Conexão com Cloud Firestore ativa e respondendo!'
          : 'Conexão offline ou pendente.'
      );
    } catch {
      setDbStatus('Erro ao testar Firestore.');
    } finally {
      setTestingDb(false);
    }
  };

  const copyRulesToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(FIRESTORE_RULES_TEXT);
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 3000);
    } catch {
      // Fallback
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 3000);
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
      </div>

      {/* Firestore Security Rules Guide & Copy Section */}
      <div className="p-6 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Regras de Segurança do Firestore</h3>
              <p className="text-xs text-zinc-400">
                Regras que autorizam Agendamentos, Clientes, Finanças e Catálogo de Serviços
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Se o seu Firebase Console reportar permissões insuficientes para a coleção de <strong>Serviços</strong>, certifique-se de copiar as regras completas abaixo e colar na aba <em>Regras (Rules)</em> do seu Console do Firebase.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={copyRulesToClipboard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#E65A00] text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition cursor-pointer"
          >
            {copiedRules ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedRules ? 'Regras Copiadas com Sucesso!' : 'Copiar Regras (firestore.rules)'}</span>
          </button>

          <a
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 transition"
          >
            <span>Abrir Console do Firebase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setShowRulesCode(!showRulesCode)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showRulesCode ? 'Ocultar Código' : 'Visualizar Código'}</span>
          </button>
        </div>

        {showRulesCode && (
          <div className="mt-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 max-h-72 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{FIRESTORE_RULES_TEXT}</pre>
          </div>
        )}
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
