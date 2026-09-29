import React, { useState } from 'react';
import { X, DollarSign, ArrowUpCircle, ArrowDownCircle, Tag, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createTransaction } from '../../services/financeService';
import type { TransactionType, TransactionStatus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const INCOME_CATEGORIES = [
  'Serviço',
  'Polimento',
  'Vitrificação',
  'Lavagem Detalhada',
  'Higienização',
  'Venda de Produtos',
  'Outras Receitas',
];

const EXPENSE_CATEGORIES = [
  'Insumos & Químicos',
  'Compostos & Boinas',
  'Aluguel do Box',
  'Energia & Água',
  'Equipamentos & Máquinas',
  'Marketing & Anúncios',
  'Diárias & Equipe',
  'Manutenção',
  'Outras Despesas',
];

export const NewTransactionModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<TransactionStatus>('paid');

  if (!isOpen) return null;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Por favor insira um valor válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setError('Por favor insira uma descrição.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createTransaction({
        userId: user.uid,
        type,
        amount: numAmount,
        category: category.trim(),
        description: description.trim(),
        date,
        status,
      });

      onClose();
      if (onCreated) onCreated();
    } catch (err: unknown) {
      console.error(err);
      setError('Erro ao salvar lançamento financeiro.');
    } finally {
      setLoading(false);
    }
  };

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === 'income'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Novo Lançamento</h3>
            <p className="text-xs text-zinc-400">Controle de fluxo de caixa e DRE</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector (Receita vs Despesa) */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Receita (Entrada)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Despesa (Gasto)</span>
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Valor (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400 text-sm font-bold">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-lg font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Categoria *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B00] transition"
              >
                {currentCategories.map((c) => (
                  <option key={c} value={c} className="bg-zinc-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Descrição do Lançamento *
            </label>
            <input
              type="text"
              required
              placeholder={type === 'income' ? 'Ex: Polimento Técnico Porsche' : 'Ex: Compra de Vitrificador Gyeon 9H'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
            />
          </div>

          {/* Date & Payment Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Data do Lançamento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B00] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B00] transition"
              >
                <option value="paid" className="bg-zinc-900">Pago / Recebido</option>
                <option value="pending" className="bg-zinc-900">A Pagar / Pendente</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg disabled:opacity-50 transition cursor-pointer ${
                type === 'income'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/20 hover:brightness-110'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 shadow-rose-600/20 hover:brightness-110'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Salvar {type === 'income' ? 'Receita' : 'Despesa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
