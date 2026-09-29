import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface Props {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<Props> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress button if already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'full') {
      return (
        <button
          onClick={install}
          className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:brightness-110 active:scale-[0.98] transition cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Instalar Fox Detailer</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        title="Instalar App no dispositivo"
        className={`flex items-center gap-2 rounded-lg bg-[#FF6B00]/15 border border-[#FF6B00]/30 px-3 py-1.5 text-xs font-medium text-[#FF7A00] hover:bg-[#FF6B00]/25 transition cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-lg bg-zinc-800/80 border border-zinc-700/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#1A1A1E] border border-zinc-700 p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/15 flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-[#FF6B00]" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Instalar Fox Detailer no iPhone</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Adicione o aplicativo à tela de início para uma experiência em tela cheia e acesso rápido:
              </p>

              <div className="space-y-3 text-sm text-zinc-300 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <span>1. Toque no botão <strong>Compartilhar</strong> no Safari</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlusSquare className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <span>2. Role a lista e escolha <strong>Adicionar à Tela de Início</strong></span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-zinc-800 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
