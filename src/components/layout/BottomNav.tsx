import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  TrendingUp,
  Users,
  Plus,
  Sparkles,
} from 'lucide-react';
import type { NavTab } from './Sidebar';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenQuickAction: () => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAction,
  pendingCount = 0,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161619]/95 backdrop-blur-lg border-t border-zinc-800/90 z-40 px-1 flex items-center justify-around">
      {/* Dashboard */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 transition ${
          activeTab === 'dashboard' ? 'text-[#FF6B00]' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="text-[9px] font-medium mt-1">Início</span>
      </button>

      {/* Agendamentos */}
      <button
        onClick={() => setActiveTab('appointments')}
        className={`relative flex flex-col items-center justify-center py-1 px-1.5 transition ${
          activeTab === 'appointments' ? 'text-[#FF6B00]' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <CalendarCheck2 className="w-4 h-4" />
        <span className="text-[9px] font-medium mt-1">Agendas</span>
        {pendingCount > 0 && (
          <span className="absolute -top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#FF6B00] text-white text-[8px] font-bold flex items-center justify-center">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {/* Quick Add Floating Center Button */}
      <button
        onClick={onOpenQuickAction}
        title="Ação Rápida"
        className="w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#FF8533] text-white flex items-center justify-center shadow-lg shadow-orange-600/40 hover:scale-105 active:scale-95 transition cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Serviços */}
      <button
        onClick={() => setActiveTab('services')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 transition ${
          activeTab === 'services' ? 'text-[#FF6B00]' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-[9px] font-medium mt-1">Serviços</span>
      </button>

      {/* Finanças */}
      <button
        onClick={() => setActiveTab('finance')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 transition ${
          activeTab === 'finance' ? 'text-[#FF6B00]' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <TrendingUp className="w-4 h-4" />
        <span className="text-[9px] font-medium mt-1">Finanças</span>
      </button>

      {/* Clientes */}
      <button
        onClick={() => setActiveTab('clients')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 transition ${
          activeTab === 'clients' ? 'text-[#FF6B00]' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="text-[9px] font-medium mt-1">Clientes</span>
      </button>
    </nav>
  );
};
