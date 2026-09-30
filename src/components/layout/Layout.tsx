import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import { NewAppointmentModal } from '../modals/NewAppointmentModal';
import { NewTransactionModal } from '../modals/NewTransactionModal';
import { NewClientModal } from '../modals/NewClientModal';
import { NewServiceModal } from '../modals/NewServiceModal';

import { Dashboard } from '../../views/Dashboard';
import { AppointmentsView } from '../../views/AppointmentsView';
import { ServicesView } from '../../views/ServicesView';
import { FinanceView } from '../../views/FinanceView';
import { ClientsView } from '../../views/ClientsView';
import { SettingsView } from '../../views/SettingsView';

import { useAuth } from '../../context/AuthContext';
import { subscribeAppointments } from '../../services/appointmentService';
import {
  subscribeTransactions,
  calculateKPIs,
  generateMonthlyChartData,
} from '../../services/financeService';
import { subscribeClients } from '../../services/clientService';
import { subscribeServices } from '../../services/serviceService';
import type {
  Appointment,
  FinancialTransaction,
  Client,
  DetailingService,
  KPIStats,
} from '../../types';
import { Calendar, DollarSign, User, Sparkles, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Firestore Live States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<DetailingService[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!user) {
      setAppointments([]);
      setTransactions([]);
      setClients([]);
      setServices([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    let loadedCount = 0;
    const checkInitialLoad = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        setLoadingData(false);
      }
    };

    // Subscribe to user's appointments
    const unsubAppointments = subscribeAppointments(
      user.uid,
      (data) => {
        setAppointments(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    // Subscribe to user's financial transactions
    const unsubTransactions = subscribeTransactions(
      user.uid,
      (data) => {
        setTransactions(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    // Subscribe to user's clients
    const unsubClients = subscribeClients(
      user.uid,
      (data) => {
        setClients(data);
      },
      () => {}
    );

    // Subscribe to user's detailing services
    const unsubServices = subscribeServices(
      user.uid,
      (data) => {
        setServices(data);
      },
      () => {}
    );

    return () => {
      unsubAppointments();
      unsubTransactions();
      unsubClients();
      unsubServices();
    };
  }, [user]);

  // Derived Metrics & Chart Data
  const kpis: KPIStats = calculateKPIs(transactions, appointments);
  const chartData = generateMonthlyChartData(transactions);
  const pendingAppointmentsCount = appointments.filter(
    (a) => a.status === 'pending'
  ).length;

  return (
    <div className="flex min-h-screen bg-[#121214] text-zinc-100">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingAppointmentsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <Header
          onNewAppointment={() => setIsAppointmentModalOpen(true)}
          onNewTransaction={() => setIsTransactionModalOpen(true)}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              appointments={appointments}
              transactions={transactions}
              kpis={kpis}
              chartData={chartData}
              loading={loadingData}
              onNewAppointment={() => setIsAppointmentModalOpen(true)}
              onNewTransaction={() => setIsTransactionModalOpen(true)}
              onGoToAppointments={() => setActiveTab('appointments')}
              onGoToFinance={() => setActiveTab('finance')}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              loading={loadingData}
              onNewAppointment={() => setIsAppointmentModalOpen(true)}
            />
          )}

          {activeTab === 'services' && (
            <ServicesView
              services={services}
              loading={loadingData}
              onNewService={() => setIsServiceModalOpen(true)}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceView
              transactions={transactions}
              loading={loadingData}
              onNewTransaction={() => setIsTransactionModalOpen(true)}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              clients={clients}
              loading={loadingData}
              onNewClient={() => setIsClientModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        pendingCount={pendingAppointmentsCount}
      />

      {/* Offline Mode Alert */}
      <OfflineIndicator />

      {/* Modals */}
      <NewAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        clients={clients}
        services={services}
      />

      <NewTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />

      <NewClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
      />

      <NewServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
      />

      {/* Mobile Quick Action Drawer */}
      {isQuickActionOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1A1A1E] border-t border-zinc-800 rounded-t-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsQuickActionOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">Ação Rápida</h3>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setIsAppointmentModalOpen(true);
                }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#FF6B00] text-left transition"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Novo Agendamento</p>
                  <p className="text-xs text-zinc-400">Marcar serviço de estética automotiva</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setIsServiceModalOpen(true);
                }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#FF6B00] text-left transition"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Novo Serviço de Catálogo</p>
                  <p className="text-xs text-zinc-400">Cadastrar serviço, valor e tempo médio</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setIsTransactionModalOpen(true);
                }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500 text-left transition"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Novo Lançamento Financeiro</p>
                  <p className="text-xs text-zinc-400">Registrar receita ou despesa de insumos</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setIsClientModalOpen(true);
                }}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500 text-left transition"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Cadastrar Cliente & Carro</p>
                  <p className="text-xs text-zinc-400">Adicionar novo contato e modelo do veículo</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
