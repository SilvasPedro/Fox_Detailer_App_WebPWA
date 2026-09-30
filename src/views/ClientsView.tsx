import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Car,
  Trash2,
  AlertCircle,
  MessageSquare,
  X,
  Pencil,
} from 'lucide-react';
import type { Client } from '../types';
import { deleteClient } from '../services/clientService';
import { EditClientModal } from '../components/modals/EditClientModal';

interface Props {
  clients: Client[];
  loading: boolean;
  onNewClient: () => void;
}

export const ClientsView: React.FC<Props> = ({
  clients,
  loading,
  onNewClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const confirmDeleteClient = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteClient(id);
      setClientToDelete(null);
    } catch (err) {
      console.error('Error deleting client:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const hasMatchingVehicle =
      (c.vehicles && c.vehicles.some((v) => v.toLowerCase().includes(term))) ||
      c.vehicleModel.toLowerCase().includes(term);

    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.secondaryPhone && c.secondaryPhone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      hasMatchingVehicle
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF6B00]" />
            <span>Gestão de Clientes</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Histórico de veículos, frotas particulares e canais de contato
          </p>
        </div>

        <button
          onClick={onNewClient}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:brightness-110 active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou modelo do veículo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
        />
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-zinc-800/40 border border-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#1A1A1E] border border-zinc-800/80 p-8 space-y-3">
          <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum cliente cadastrado</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchTerm
              ? 'Nenhum resultado para a busca realizada.'
              : 'Cadastre seus clientes com veículos e telefones para agilizar seus agendamentos.'}
          </p>
          <button
            onClick={onNewClient}
            className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-xs font-semibold text-white shadow-md cursor-pointer hover:brightness-110"
          >
            + Cadastrar Primeiro Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => {
            const cleanPhone = client.phone.replace(/\D/g, '');
            const cleanSecondaryPhone = client.secondaryPhone
              ? client.secondaryPhone.replace(/\D/g, '')
              : '';

            const clientVehicles =
              client.vehicles && client.vehicles.length > 0
                ? client.vehicles
                : [client.vehicleModel];

            return (
              <div
                key={client.id}
                className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition"
              >
                <div>
                  {/* Client Header & Action Buttons */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{client.name}</h3>
                      <div className="space-y-0.5 mt-1">
                        <p className="text-xs text-zinc-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{client.phone}</span>
                        </p>
                        {client.secondaryPhone && (
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>Tel 2: {client.secondaryPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingClient(client)}
                        title="Editar cliente"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setClientToDelete(client)}
                        disabled={deletingId === client.id}
                        title="Remover cliente"
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vehicles List */}
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>
                          {clientVehicles.length > 1
                            ? `Veículos (${clientVehicles.length})`
                            : 'Veículo Principal'}
                        </span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {clientVehicles.map((veh, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0" />
                          <span className="text-xs font-semibold text-zinc-200 truncate">
                            {veh}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                {/* WhatsApp Contact Actions */}
                <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/55${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(
                      client.name
                    )}%2C%20tudo%20bem%3F%20Aqui%20%C3%A9%20da%20Fox%20Detailer!`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/25 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {cleanSecondaryPhone && (
                    <a
                      href={`https://wa.me/55${cleanSecondaryPhone}?text=Ol%C3%A1%20${encodeURIComponent(
                        client.name
                      )}%2C%20tudo%20bem%3F%20Aqui%20%C3%A9%20da%20Fox%20Detailer!`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp Tel 2"
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                    >
                      <span>Tel 2</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={!!editingClient}
        client={editingClient}
        onClose={() => setEditingClient(null)}
      />

      {/* Confirmation Modal for Client Delete */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#1A1A1E] border border-zinc-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setClientToDelete(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Remover Cliente?</h3>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Deseja realmente remover o cliente{' '}
              <strong className="text-white">{clientToDelete.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={deletingId === clientToDelete.id}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteClient(clientToDelete.id)}
                disabled={deletingId === clientToDelete.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {deletingId === clientToDelete.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Sim, Remover</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
