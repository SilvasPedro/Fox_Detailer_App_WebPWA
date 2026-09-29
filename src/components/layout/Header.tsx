import React from 'react';
import { Plus, Calendar, DollarSign, Flame, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import type { NavTab } from './Sidebar';

interface HeaderProps {
  onNewAppointment: () => void;
  onNewTransaction: () => void;
  setActiveTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewAppointment,
  onNewTransaction,
  setActiveTab,
}) => {
  const { user } = useAuth();

  // Format current date in Portuguese
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const formattedDate = new Intl.DateTimeFormat('pt-BR', options).format(now);
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const firstName = user?.displayName
    ? user.displayName.split(' ')[0]
    : 'Operador';

  return (
    <header className="sticky top-0 z-30 bg-[#121214]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 py-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* User Greeting & Date */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          {/* Mobile brand badge */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B00] to-[#CC4400] flex items-center justify-center shadow-md">
              <Flame className="w-4 h-4 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Olá, {firstName}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sistema online" />
            </h2>
            <p className="text-xs text-zinc-400 capitalize">{capitalizedDate}</p>
          </div>

          {/* Mobile Settings Shortcut */}
          <button
            onClick={() => setActiveTab('settings')}
            className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/60"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto w-full sm:w-auto">
          <PWAInstallButton className="hidden sm:flex" />

          <button
            onClick={onNewTransaction}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-xs sm:text-sm font-medium text-zinc-200 border border-zinc-700/60 transition cursor-pointer active:scale-95"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Lançamento</span>
          </button>

          <button
            onClick={onNewAppointment}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] hover:brightness-110 text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-600/20 transition cursor-pointer active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>
    </header>
  );
};
