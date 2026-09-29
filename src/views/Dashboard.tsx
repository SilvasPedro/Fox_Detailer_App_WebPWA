import React, { useState } from 'react';
import {
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  Car,
  Clock,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { Appointment, FinancialTransaction, KPIStats, MonthlyChartPoint } from '../types';
import { updateAppointmentStatus, seedInitialAppointments } from '../services/appointmentService';
import { seedInitialTransactions } from '../services/financeService';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  appointments: Appointment[];
  transactions: FinancialTransaction[];
  kpis: KPIStats;
  chartData: MonthlyChartPoint[];
  loading: boolean;
  onNewAppointment: () => void;
  onNewTransaction: () => void;
  onGoToAppointments: () => void;
  onGoToFinance: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  appointments,
  transactions,
  kpis,
  chartData,
  loading,
  onNewAppointment,
  onNewTransaction,
  onGoToAppointments,
  onGoToFinance,
}) => {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDateDisplay = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoDate;
    }
  };

  const handleSeedData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await Promise.all([
        seedInitialAppointments(user.uid),
        seedInitialTransactions(user.uid),
      ]);
    } catch (err) {
      console.error('Error seeding data:', err);
    } finally {
      setSeeding(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-3 h-3" />
            Em Andamento
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Concluído
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            Cancelado
          </span>
        );
    }
  };

  // Skeletons during loading
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-zinc-800/50 border border-zinc-800" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-zinc-800/50 border border-zinc-800" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-zinc-800/50 border border-zinc-800" />
          <div className="h-64 rounded-2xl bg-zinc-800/50 border border-zinc-800" />
        </div>
      </div>
    );
  }

  const isProfitPositive = kpis.monthProfit >= 0;
  const recentAppointments = appointments.slice(0, 5);
  const recentTransactions = transactions.slice(0, 5);

  const isDatabaseEmpty = appointments.length === 0 && transactions.length === 0;

  return (
    <div className="space-y-6">
      {/* If Database is completely empty, show friendly Welcome & Seed Banner */}
      {isDatabaseEmpty && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#FF6B00]/15 via-zinc-900 to-[#1A1A1E] border border-[#FF6B00]/30 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FF6B00]/20 text-[#FF7A00] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Bem-vindo ao Fox Detailer
              </div>
              <h3 className="text-xl font-bold text-white">Sua estética automotiva pronta para acelerar!</h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                Seu banco de dados Cloud Firestore está ativo e pronto. Você pode cadastrar seus próprios agendamentos e transações, ou carregar dados de demonstração com serviços automotivos realistas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs sm:text-sm font-semibold text-white border border-zinc-700 transition cursor-pointer"
              >
                {seeding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Database className="w-4 h-4 text-[#FF6B00]" />
                )}
                <span>Carregar Dados de Exemplo</span>
              </button>
              <button
                onClick={onNewAppointment}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-600/20 hover:brightness-110 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Primeiro Agendamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Agendamentos Pendentes */}
        <div className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800/90 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Agendamentos Pendentes
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{kpis.pendingAppointmentsCount}</span>
            <span className="text-xs text-zinc-400">serviços em espera</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/80">
            <span>Concluídos no mês:</span>
            <span className="font-semibold text-zinc-200">{kpis.completedThisMonth}</span>
          </div>
        </div>

        {/* KPI 2: Receita do Mês */}
        <div className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800/90 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Receita do Mês
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {formatBRL(kpis.monthRevenue)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/80">
            <span>Faturamento Bruto</span>
            <span className="text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Entradas
            </span>
          </div>
        </div>

        {/* KPI 3: Gastos do Mês */}
        <div className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800/90 shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Gastos do Mês
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black text-rose-400">
              {formatBRL(kpis.monthExpenses)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/80">
            <span>Insumos & Operacional</span>
            <span className="text-rose-400 font-semibold">Saídas</span>
          </div>
        </div>

        {/* KPI 4: Lucro do Mês */}
        <div
          className={`p-5 rounded-2xl bg-[#1A1A1E] border shadow-lg relative overflow-hidden transition ${
            isProfitPositive
              ? 'border-emerald-500/30 hover:border-emerald-500/60'
              : 'border-rose-500/30 hover:border-rose-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Lucro Líquido do Mês
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isProfitPositive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                isProfitPositive ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatBRL(kpis.monthProfit)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-zinc-800/80">
            <span className="text-zinc-400">Margem Líquida:</span>
            <span
              className={`font-bold ${
                isProfitPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {kpis.profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Comparative Balance Chart (Receita vs Gastos vs Lucro) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#1A1A1E] border border-zinc-800/90 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF6B00]" />
              <span>Comparativo Financeiro Semestral</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Relação de Receitas, Despesas e Lucro Líquido apurados
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-zinc-300">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-zinc-300">Despesas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF6B00]" />
              <span className="text-zinc-300">Lucro</span>
            </div>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" stroke="#71717a" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#3f3f46',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(val: unknown) => [formatBRL(Number(val) || 0), '']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Receitas"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Despesas"
                stroke="#F43F5E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpenses)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Lucro Líquido"
                stroke="#FF6B00"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Grid: Próximos Agendamentos & Últimas Transações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Próximos Agendamentos */}
        <div className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800/90 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-[#FF6B00]" />
                <span>Agendamentos Recentes</span>
              </h4>
              <button
                onClick={onGoToAppointments}
                className="text-xs font-semibold text-[#FF6B00] hover:underline cursor-pointer"
              >
                Ver todos ({appointments.length})
              </button>
            </div>

            {recentAppointments.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm">Nenhum agendamento cadastrado.</p>
                <button
                  onClick={onNewAppointment}
                  className="mt-2 text-xs font-semibold text-[#FF6B00] hover:underline"
                >
                  + Agendar primeiro cliente
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {recentAppointments.map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {app.vehicleModel}
                        </span>
                        {app.vehiclePlate && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {app.vehiclePlate}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {app.clientName} • <span className="text-zinc-300">{app.serviceType}</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FF6B00]" />
                        <span>{formatDateDisplay(app.scheduledDate)}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-black text-white">
                        {formatBRL(app.price)}
                      </span>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800/80 mt-2">
            <button
              onClick={onNewAppointment}
              className="w-full py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FF6B00]" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>

        {/* Right Column: Últimas Transações Financeiras */}
        <div className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800/90 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Últimos Lançamentos</span>
              </h4>
              <button
                onClick={onGoToFinance}
                className="text-xs font-semibold text-[#FF6B00] hover:underline cursor-pointer"
              >
                Fluxo completo ({transactions.length})
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm">Nenhum lançamento registrado neste mês.</p>
                <button
                  onClick={onNewTransaction}
                  className="mt-2 text-xs font-semibold text-emerald-400 hover:underline"
                >
                  + Adicionar primeira receita ou despesa
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {tx.description}
                        </p>
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-300">
                            {tx.category}
                          </span>
                          <span>•</span>
                          <span>{tx.date}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-bold ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.amount)}
                      </span>
                      <p className="text-[10px] text-zinc-500 capitalize">
                        {tx.status === 'paid' ? 'Efetivado' : 'Pendente'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800/80 mt-2">
            <button
              onClick={onNewTransaction}
              className="w-full py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Novo Lançamento Financeiro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
