import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Flame,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export type NavTab = 'dashboard' | 'appointments' | 'services' | 'finance' | 'clients' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount = 0,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'appointments' as NavTab,
      label: 'Agendamentos',
      icon: CalendarCheck2,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'services' as NavTab,
      label: 'Serviços',
      icon: Sparkles,
    },
    {
      id: 'finance' as NavTab,
      label: 'Financeiro',
      icon: TrendingUp,
    },
    {
      id: 'clients' as NavTab,
      label: 'Clientes',
      icon: Users,
    },
    {
      id: 'settings' as NavTab,
      label: 'Configurações',
      icon: Settings,
    },
  ];

  const userInitial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'F';

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#161619] border-r border-zinc-800/80 min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] via-[#FF5500] to-[#CC4400] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white uppercase flex items-center gap-1.5">
              <span>Fox</span>
              <span className="text-[#FF6B00]">Detailer</span>
            </h1>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
              Estética Automotiva
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF6B00]/20 to-[#FF6B00]/5 text-[#FF7A00] border-l-4 border-[#FF6B00]'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition ${
                    isActive ? 'text-[#FF6B00]' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#FF6B00] text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* PWA Install Button Box in Sidebar */}
      <div className="px-3 pb-3">
        <PWAInstallButton className="w-full justify-center" />
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-zinc-800/80 bg-[#131316]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Usuário'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#FF6B00]/30 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-800 ring-2 ring-[#FF6B00]/30 flex items-center justify-center text-sm font-bold text-[#FF6B00] shrink-0">
                {userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-100 truncate">
                {user?.displayName || 'Operador Fox'}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {user?.email || 'pedrosouzactt@gmail.com'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sair do sistema"
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
