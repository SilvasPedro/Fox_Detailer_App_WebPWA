import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  Tag,
  DollarSign,
  X,
} from 'lucide-react';
import type { FinancialTransaction, TransactionType } from '../types';
import { deleteTransaction } from '../services/financeService';

interface Props {
  transactions: FinancialTransaction[];
  loading: boolean;
  onNewTransaction: () => void;
}

export const FinanceView: React.FC<Props> = ({
  transactions,
  loading,
  onNewTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const confirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      setTransactionToDelete(null);
    } catch (err) {
      console.error('Error deleting transaction:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term);
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Fluxo de Caixa & Finanças</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gestão detalhada de faturamento, despesas com insumos e lucratividade
          </p>
        </div>

        <button
          onClick={onNewTransaction}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:brightness-110 active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Entradas (Receitas)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {formatBRL(totalIncome)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Acumulado registrado</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Saídas (Despesas)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-400">
              {formatBRL(totalExpense)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Insumos, aluguel e produtos</p>
        </div>

        <div
          className={`p-5 rounded-2xl bg-[#1A1A1E] border shadow-xl ${
            netBalance >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Saldo Líquido
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                netBalance >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                netBalance >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatBRL(netBalance)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Receitas menos Despesas</p>
        </div>
      </div>

      {/* Search & Type Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-zinc-200 text-zinc-900 shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Todas ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              typeFilter === 'income'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Receitas ({transactions.filter((t) => t.type === 'income').length})
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              typeFilter === 'expense'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Despesas ({transactions.filter((t) => t.type === 'expense').length})
          </button>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-[#1A1A1E] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-zinc-800/40 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center p-8 space-y-3">
            <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhum lançamento encontrado</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Adicione lançamentos de pagamentos recebidos ou compras de produtos.
            </p>
            <button
              onClick={onNewTransaction}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white shadow-md cursor-pointer hover:bg-emerald-500"
            >
              + Adicionar Lançamento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-zinc-900/40 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      t.type === 'income'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {t.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#FF6B00]" />
                        {t.category}
                      </span>
                      <span>•</span>
                      <span>{t.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-sm sm:text-base font-black ${
                        t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'} {formatBRL(t.amount)}
                    </p>
                    <span className="text-[10px] text-zinc-500">
                      {t.status === 'paid' ? 'Efetivado' : 'Aguardando'}
                    </span>
                  </div>

                  <button
                    onClick={() => setTransactionToDelete(t)}
                    disabled={deletingId === t.id}
                    title="Excluir lançamento"
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#1A1A1E] border border-zinc-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setTransactionToDelete(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Excluir Lançamento?</h3>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Deseja realmente remover o lançamento{' '}
              <strong className="text-white">"{transactionToDelete.description}"</strong> no valor de{' '}
              <strong className="text-emerald-400">{formatBRL(transactionToDelete.amount)}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                disabled={deletingId === transactionToDelete.id}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(transactionToDelete.id)}
                disabled={deletingId === transactionToDelete.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {deletingId === transactionToDelete.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
