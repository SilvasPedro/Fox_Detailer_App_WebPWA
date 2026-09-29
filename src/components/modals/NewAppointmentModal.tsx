import React, { useState } from 'react';
import { X, Calendar, Car, User, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createAppointment } from '../../services/appointmentService';
import { createTransaction } from '../../services/financeService';
import type { AppointmentStatus } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const COMMON_SERVICES = [
  'Lavagem Detalhada Premium',
  'Polimento Comercial',
  'Polimento Técnico',
  'Vitrificação Cerâmica 9H',
  'Higienização Interna + Couro',
  'Detalhamento de Chassi e Motor',
  'Cristalização de Vidros',
  'Remoção de Chuva Ácida',
  'Proteção de Pintura PPF',
];

export const NewAppointmentModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [serviceType, setServiceType] = useState(COMMON_SERVICES[0]);
  const [price, setPrice] = useState('350');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState<AppointmentStatus>('pending');
  const [notes, setNotes] = useState('');
  const [createFinancialEntry, setCreateFinancialEntry] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!clientName.trim() || !vehicleModel.trim() || !serviceType.trim()) {
      setError('Por favor preencha o nome do cliente, veículo e serviço.');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Valor do serviço inválido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const appointmentId = await createAppointment({
        userId: user.uid,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        vehicleModel: vehicleModel.trim(),
        vehiclePlate: vehiclePlate.trim().toUpperCase(),
        serviceType: serviceType.trim(),
        price: numPrice,
        scheduledDate,
        status,
        notes: notes.trim(),
      });

      // If user requested automatic financial entry
      if (createFinancialEntry && appointmentId && numPrice > 0) {
        await createTransaction({
          userId: user.uid,
          type: 'income',
          amount: numPrice,
          category: 'Serviço',
          description: `${serviceType} - ${vehicleModel} (${clientName})`,
          date: scheduledDate.split('T')[0],
          status: status === 'completed' ? 'paid' : 'pending',
          appointmentId,
        });
      }

      onClose();
      if (onCreated) onCreated();
    } catch (err: unknown) {
      console.error(err);
      setError('Erro ao salvar agendamento no Firestore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Novo Agendamento</h3>
            <p className="text-xs text-zinc-400">Cadastrar serviço de estética automotiva</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nome do Cliente *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mendes"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
              />
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Veículo / Modelo *
              </label>
              <div className="relative">
                <Car className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Porsche 911 / BMW 320i"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Placa
              </label>
              <input
                type="text"
                placeholder="ABC-1234"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
              />
            </div>
          </div>

          {/* Service & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Serviço de Detalhamento *
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B00] transition"
              >
                {COMMON_SERVICES.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Valor do Serviço (R$) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="350.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                />
              </div>
            </div>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Data e Horário *
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B00] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Status Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B00] transition"
              >
                <option value="pending" className="bg-zinc-900">Pendente (Em espera)</option>
                <option value="in_progress" className="bg-zinc-900">Em Andamento</option>
                <option value="completed" className="bg-zinc-900">Concluído</option>
                <option value="cancelled" className="bg-zinc-900">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Observações do Veículo / Cuidados Especiais
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cuidado com verniz macio asiático, bancos de couro com hidratação extra..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
            />
          </div>

          {/* Checkbox for auto financial entry */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={createFinancialEntry}
              onChange={(e) => setCreateFinancialEntry(e.target.checked)}
              className="w-4 h-4 accent-[#FF6B00] rounded"
            />
            <span className="text-xs text-zinc-300">
              Registrar automaticamente no fluxo financeiro
            </span>
          </label>

          {/* Submit buttons */}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Salvar Agendamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
