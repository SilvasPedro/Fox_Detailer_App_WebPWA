import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Clock,
  DollarSign,
  Trash2,
  AlertCircle,
  X,
  Pencil,
  FileText,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import type { DetailingService } from '../types';
import { deleteService, seedInitialServices } from '../services/serviceService';
import { NewServiceModal } from '../components/modals/NewServiceModal';
import { EditServiceModal } from '../components/modals/EditServiceModal';
import { useAuth } from '../context/AuthContext';

interface Props {
  services: DetailingService[];
  loading: boolean;
  onNewService: () => void;
}

export const ServicesView: React.FC<Props> = ({
  services,
  loading,
  onNewService,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<DetailingService | null>(null);
  const [editingService, setEditingService] = useState<DetailingService | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [seedingDefault, setSeedingDefault] = useState(false);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const confirmDeleteService = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteService(id);
      setServiceToDelete(null);
    } catch (err) {
      console.error('Error deleting service:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedDefaults = async () => {
    if (!user) return;
    setSeedingDefault(true);
    try {
      await seedInitialServices(user.uid);
    } catch (err) {
      console.error('Error seeding services:', err);
    } finally {
      setSeedingDefault(false);
    }
  };

  const filtered = services.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.description && s.description.toLowerCase().includes(term)) ||
      s.duration.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#FF6B00]" />
            <span>Catálogo de Serviços</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gerencie os serviços, valores de tabela e tempos médios de execução
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:brightness-110 active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar serviço por nome, tempo médio ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
        />
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-zinc-800/40 border border-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#1A1A1E] border border-zinc-800/80 p-8 space-y-4">
          <Wrench className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum serviço cadastrado</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {searchTerm
              ? 'Nenhum resultado para a busca realizada.'
              : 'Cadastre seus serviços personalizados de detalhamento ou carregue os serviços comuns da estética automotiva para começar.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-xs font-semibold text-white shadow-md cursor-pointer hover:brightness-110"
            >
              + Cadastrar Primeiro Serviço
            </button>

            {services.length === 0 && (
              <button
                onClick={handleSeedDefaults}
                disabled={seedingDefault}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition cursor-pointer"
              >
                {seedingDefault ? 'Carregando...' : 'Carregar Catálogo Sugerido'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service) => (
            <div
              key={service.id}
              className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition"
            >
              <div>
                {/* Header: Service Name & Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{service.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30">
                        <Clock className="w-3 h-3" />
                        <span>{service.duration}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingService(service)}
                      title="Editar serviço"
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setServiceToDelete(service)}
                      disabled={deletingId === service.id}
                      title="Remover serviço"
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description if present */}
                {service.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Price Banner */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Valor de Tabela:</span>
                <span className="text-lg font-black text-emerald-400">
                  {formatBRL(service.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Service Modal */}
      <NewServiceModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      {/* Edit Service Modal */}
      <EditServiceModal
        isOpen={!!editingService}
        service={editingService}
        onClose={() => setEditingService(null)}
      />

      {/* Confirmation Modal for Delete Service */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#1A1A1E] border border-zinc-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setServiceToDelete(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Excluir Serviço?</h3>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Deseja realmente remover o serviço{' '}
              <strong className="text-white">"{serviceToDelete.name}"</strong> no valor de{' '}
              <strong className="text-emerald-400">{formatBRL(serviceToDelete.price)}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                disabled={deletingId === serviceToDelete.id}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteService(serviceToDelete.id)}
                disabled={deletingId === serviceToDelete.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {deletingId === serviceToDelete.id ? (
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
