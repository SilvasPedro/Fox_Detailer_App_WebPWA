import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { getActiveFirebaseConfig, FirebaseCustomConfig } from '../../firebase';
import defaultFirebaseConfig from '../../../firebase-applet-config.json';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FIRESTORE_RULES_CONTENT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }
    function incoming() { return request.resource.data; }
    function existing() { return resource.data; }
    function isSignedIn() { return request.auth != null; }

    match /test/{testId} {
      allow get: if true;
      allow write: if false;
    }

    match /appointments/{appointmentId} {
      allow get: if isSignedIn() && isValidId(appointmentId) && existing().userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && isValidId(appointmentId) && incoming().userId == request.auth.uid;
      allow update: if isSignedIn() && isValidId(appointmentId) && existing().userId == request.auth.uid && incoming().userId == existing().userId;
      allow delete: if isSignedIn() && isValidId(appointmentId) && existing().userId == request.auth.uid;
    }

    match /financial_transactions/{transactionId} {
      allow get: if isSignedIn() && isValidId(transactionId) && existing().userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && isValidId(transactionId) && incoming().userId == request.auth.uid;
      allow update: if isSignedIn() && isValidId(transactionId) && existing().userId == request.auth.uid && incoming().userId == existing().userId;
      allow delete: if isSignedIn() && isValidId(transactionId) && existing().userId == request.auth.uid;
    }

    match /clients/{clientId} {
      allow get: if isSignedIn() && isValidId(clientId) && existing().userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && isValidId(clientId) && incoming().userId == request.auth.uid;
      allow update: if isSignedIn() && isValidId(clientId) && existing().userId == request.auth.uid && incoming().userId == existing().userId;
      allow delete: if isSignedIn() && isValidId(clientId) && existing().userId == request.auth.uid;
    }
  }
}`;

export const CustomFirebaseModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const currentConfig = getActiveFirebaseConfig();
  const hasCustomConfig =
    typeof window !== 'undefined' &&
    !!localStorage.getItem('fox_custom_firebase_config');

  const [rawJson, setRawJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const handleSaveJson = () => {
    setError(null);
    try {
      let cleaned = rawJson.trim();
      // Handle "const firebaseConfig = { ... };" if copied directly
      if (cleaned.includes('=')) {
        cleaned = cleaned.substring(cleaned.indexOf('{'));
        if (cleaned.endsWith(';')) cleaned = cleaned.slice(0, -1);
      }

      // Convert JS object keys into valid JSON if unquoted
      const normalized = cleaned
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"');

      const parsed: FirebaseCustomConfig = JSON.parse(normalized);

      if (!parsed.apiKey || !parsed.projectId) {
        setError('O JSON precisa conter pelo menos "apiKey" e "projectId".');
        return;
      }

      localStorage.setItem('fox_custom_firebase_config', JSON.stringify(parsed));
      window.location.reload();
    } catch {
      setError(
        'JSON inválido. Certifique-se de colar o objeto de configuração copiado do console do Firebase.'
      );
    }
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('fox_custom_firebase_config');
    window.location.reload();
  };

  const copyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_CONTENT);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 3000);
  };

  const vercelEnvTemplate = `VITE_FIREBASE_API_KEY="${currentConfig.apiKey}"
VITE_FIREBASE_AUTH_DOMAIN="${currentConfig.authDomain}"
VITE_FIREBASE_PROJECT_ID="${currentConfig.projectId}"
VITE_FIREBASE_STORAGE_BUCKET="${currentConfig.storageBucket || ''}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${currentConfig.messagingSenderId || ''}"
VITE_FIREBASE_APP_ID="${currentConfig.appId}"`;

  const copyVercelEnv = () => {
    navigator.clipboard.writeText(vercelEnvTemplate);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Configurar Firebase para o Vercel</h3>
            <p className="text-xs text-zinc-400">
              Autorização de domínio e controle total do banco de dados
            </p>
          </div>
        </div>

        {/* Why this happens alert */}
        <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Por que o link do Vercel não estava autorizado?</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            O Firebase padrão provisionado pelo AI Studio roda em um projeto de nuvem gerenciado, que autoriza exclusivamente o ambiente de desenvolvimento interno. Por segurança, o Google não permite acesso IAM ao console desse projeto de nuvem fechado para cadastrar domínios externos como <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-amber-400 font-mono">foxdetailerappwebpwa.vercel.app</code>.
          </p>
          <p className="text-zinc-300 leading-relaxed font-semibold">
            Para publicar em produção no Vercel e ter 100% de controle para visualizar, editar coleções e gerenciar permissões com o seu e-mail, conecte o seu próprio projeto gratuito do Firebase.
          </p>
        </div>

        {/* Passo a Passo */}
        <div className="space-y-4 text-xs text-zinc-300">
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#FF6B00]" />
              <span>Passo a Passo Rápido (3 minutos):</span>
            </h4>

            <ol className="list-decimal pl-4 space-y-2 text-zinc-300">
              <li>
                Acesse o{' '}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#FF6B00] font-semibold underline inline-flex items-center gap-1"
                >
                  Firebase Console <ExternalLink className="w-3 h-3" />
                </a>{' '}
                com o seu e-mail e crie um projeto (ex: <em>Fox Detailer</em>).
              </li>
              <li>
                Em <strong>Authentication &gt; Sign-in method</strong>, ative o provedor <strong>Google</strong>.
              </li>
              <li>
                Na aba <strong>Configurações &gt; Domínios autorizados</strong>, clique em <strong>Adicionar domínio</strong> e insira:
                <div className="mt-1 font-mono text-white bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between">
                  <span>foxdetailerappwebpwa.vercel.app</span>
                </div>
              </li>
              <li>
                Em <strong>Cloud Firestore</strong>, crie o banco de dados e na aba <strong>Regras (Rules)</strong> cole as regras de segurança:
                <div className="mt-1.5">
                  <button
                    onClick={copyRules}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition cursor-pointer"
                  >
                    {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRules ? 'Regras Copiadas!' : 'Copiar firestore.rules'}</span>
                  </button>
                </div>
              </li>
              <li>
                Em <strong>Configurações do Projeto &gt; Seus aplicativos &gt; Web (ícone &lt;/&gt;)</strong>, copie o objeto <code className="text-zinc-200">firebaseConfig</code> e cole no campo abaixo:
              </li>
            </ol>
          </div>

          {/* Input Firebase Config */}
          <div className="space-y-2">
            <label className="block font-bold text-white">
              Cole aqui o seu firebaseConfig:
            </label>
            <textarea
              rows={5}
              placeholder={`{\n  apiKey: "AIzaSy...",\n  authDomain: "seu-projeto.firebaseapp.com",\n  projectId: "seu-projeto",\n  storageBucket: "...",\n  messagingSenderId: "...",\n  appId: "..."\n}`}
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition"
            />
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div>
              {hasCustomConfig && (
                <button
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar padrão do AI Studio</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSaveJson}
                disabled={!rawJson.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-xs font-semibold text-white shadow-lg shadow-orange-600/20 hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Salvar e Aplicar</span>
              </button>
            </div>
          </div>

          {/* Vercel Environment Variables option */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200">Opção 2: Variáveis de Ambiente no Vercel (Recomendado para Deploy)</span>
              <button
                onClick={copyVercelEnv}
                className="text-[11px] text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copiado!' : 'Copiar Modelo .env'}</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              No painel do seu projeto no Vercel (<strong>Settings &gt; Environment Variables</strong>), você pode definir as variáveis com as chaves do seu Firebase para que qualquer build utilize automaticamente o seu banco de dados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
