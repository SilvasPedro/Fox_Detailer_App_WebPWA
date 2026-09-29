import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Clock,
  Car,
  User,
  Phone,
  CheckCircle2,
  Sparkles,
  Trash2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { Appointment, AppointmentStatus } from '../types';
import { updateAppointmentStatus, deleteAppointment } from '../services/appointmentService';

interface Props {
  appointments: Appointment[];
  loading: boolean;
  onNewAppointment: () => void;
}

export const AppointmentsView: React.FC<Props> = ({
  appointments,
  loading,
  onNewAppointment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus);
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este agendamento?')) return;
    setDeletingId(id);
    try {
      await deleteAppointment(id);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered appointments
  const filtered = appointments.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      app.clientName.toLowerCase().includes(term) ||
      app.vehicleModel.toLowerCase().includes(term) ||
      (app.vehiclePlate && app.vehiclePlate.toLowerCase().includes(term)) ||
      app.serviceType.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#FF6B00]" />
            <span>Gestão de Agendamentos</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Acompanhe serviços marcados, em execução e finalizados
          </p>
        </div>

        <button
          onClick={onNewAppointment}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:brightness-110 active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, veículo, placa ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#FF6B00] text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({appointments.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Pendentes ({appointments.filter((a) => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              statusFilter === 'in_progress'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Em Andamento ({appointments.filter((a) => a.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Concluídos ({appointments.filter((a) => a.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Appointment Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-zinc-800/40 border border-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#1A1A1E] border border-zinc-800/80 p-8 space-y-3">
          <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente ajustar os filtros ou a busca acima.'
              : 'Comece adicionando seu primeiro agendamento para organizar sua oficina.'}
          </p>
          <button
            onClick={onNewAppointment}
            className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-xs font-semibold text-white shadow-md cursor-pointer hover:brightness-110"
          >
            + Cadastrar Agendamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800/90 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition"
            >
              <div>
                {/* Header: Vehicle & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-[#FF6B00] shrink-0" />
                      <span>{app.vehicleModel}</span>
                    </h3>
                    {app.vehiclePlate && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 inline-block mt-1">
                        Placa: {app.vehiclePlate}
                      </span>
                    )}
                  </div>

                  <span className="text-base font-black text-emerald-400">
                    {formatBRL(app.price)}
                  </span>
                </div>

                {/* Service Type */}
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 mb-3">
                  <p className="text-xs font-semibold text-zinc-200">{app.serviceType}</p>
                </div>

                {/* Client Info & Date */}
                <div className="space-y-1.5 text-xs text-zinc-400 mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-300 font-medium">{app.clientName}</span>
                  </div>

                  {app.clientPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <a
                        href={`https://wa.me/55${app.clientPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline"
                      >
                        {app.clientPhone}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>
                      {new Date(app.scheduledDate).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {app.notes && (
                    <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-400">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{app.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Switcher & Actions */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <select
                  value={app.status}
                  onChange={(e) =>
                    handleStatusChange(app.id, e.target.value as AppointmentStatus)
                  }
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition cursor-pointer focus:outline-none ${
                    app.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : app.status === 'in_progress'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : app.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  <option value="pending" className="bg-zinc-900 text-amber-400">
                    Pendente
                  </option>
                  <option value="in_progress" className="bg-zinc-900 text-blue-400">
                    Em Andamento
                  </option>
                  <option value="completed" className="bg-zinc-900 text-emerald-400">
                    Concluído
                  </option>
                  <option value="cancelled" className="bg-zinc-900 text-zinc-400">
                    Cancelado
                  </option>
                </select>

                <button
                  onClick={() => handleDelete(app.id)}
                  disabled={deletingId === app.id}
                  title="Excluir agendamento"
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
