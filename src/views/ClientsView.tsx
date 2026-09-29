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
} from 'lucide-react';
import type { Client } from '../types';
import { deleteClient } from '../services/clientService';

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

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este cliente?')) return;
    setDeletingId(id);
    try {
      await deleteClient(id);
    } catch (err) {
      console.error('Error deleting client:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.vehicleModel.toLowerCase().includes(term) ||
      (c.vehiclePlate && c.vehiclePlate.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF6B00]" />
            <span>Fidelização de Clientes (CRM)</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Cadastro de proprietários e histórico de veículos atendidos
          </p>
        </div>

        <button
          onClick={onNewClient}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:brightness-110 active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar cliente por nome, telefone, veículo ou placa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
        />
      </div>

      {/* Grid of Clients */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-zinc-800/40 border border-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#1A1A1E] border border-zinc-800/80 p-8 space-y-3">
          <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum cliente encontrado</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Cadastre os dados dos clientes para enviar mensagens no WhatsApp e lembrar revisões.
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
            return (
              <div
                key={client.id}
                className="p-5 rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">{client.name}</h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{client.phone}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(client.id)}
                      disabled={deletingId === client.id}
                      title="Remover cliente"
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Vehicle details */}
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 mb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-[#FF6B00]" />
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {client.vehicleModel}
                      </span>
                    </div>
                    {client.vehiclePlate && (
                      <p className="text-[11px] font-mono text-zinc-400 pl-6">
                        Placa: {client.vehiclePlate}
                      </p>
                    )}
                  </div>

                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <a
                    href={`https://wa.me/55${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(
                      client.name
                    )}%2C%20tudo%20bem%3F%20Aqui%20%C3%A9%20da%20Fox%20Detailer!`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/25 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
