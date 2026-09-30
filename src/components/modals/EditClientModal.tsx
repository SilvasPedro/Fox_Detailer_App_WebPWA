import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Car,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import type { Client } from '../../types';
import { updateClient } from '../../services/clientService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onUpdated?: () => void;
}

export const EditClientModal: React.FC<Props> = ({
  isOpen,
  onClose,
  client,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicles, setVehicles] = useState<string[]>(['']);

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setSecondaryPhone(client.secondaryPhone || '');
      setEmail(client.email || '');

      if (client.vehicles && client.vehicles.length > 0) {
        setVehicles(client.vehicles);
      } else if (client.vehicleModel) {
        setVehicles([client.vehicleModel]);
      } else {
        setVehicles(['']);
      }
      setError(null);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleVehicleChange = (index: number, val: string) => {
    const updated = [...vehicles];
    updated[index] = val;
    setVehicles(updated);
  };

  const handleAddVehicle = () => {
    setVehicles([...vehicles, '']);
  };

  const handleRemoveVehicle = (index: number) => {
    if (vehicles.length <= 1) {
      setVehicles(['']);
      return;
    }
    const updated = vehicles.filter((_, idx) => idx !== index);
    setVehicles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filteredVehicles = vehicles
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (!name.trim() || !phone.trim() || filteredVehicles.length === 0) {
      setError('Por favor preencha nome, telefone principal e pelo menos um veículo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateClient(client.id, {
        name: name.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim() || '',
        email: email.trim() || '',
        vehicleModel: filteredVehicles[0],
        vehicles: filteredVehicles,
      });

      onClose();
      if (onUpdated) onUpdated();
    } catch (err: unknown) {
      console.error(err);
      setError('Erro ao atualizar cliente no Firestore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00]">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Editar Cliente</h3>
            <p className="text-xs text-zinc-400">Atualize informações de contato e frota</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Ex: Roberto Gomes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
              />
            </div>
          </div>

          {/* Telefones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Telefone / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="(11) 98888-7777"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Segundo Telefone (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="(11) 97777-6666"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              E-mail (Opcional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
              />
            </div>
          </div>

          {/* Veículos do Cliente */}
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#FF6B00]" />
                <span>Veículos do Cliente *</span>
              </label>
              <button
                type="button"
                onClick={handleAddVehicle}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 text-[#FF6B00] text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Veículo</span>
              </button>
            </div>

            <div className="space-y-2">
              {vehicles.map((veh, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Car className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required={idx === 0}
                      placeholder={
                        idx === 0
                          ? 'Veículo Principal (Ex: Audi A3 Sedan)'
                          : `Veículo ${idx + 1} (Ex: Porsche Macan)`
                      }
                      value={veh}
                      onChange={(e) => handleVehicleChange(idx, e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                    />
                  </div>

                  {vehicles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVehicle(idx)}
                      title="Remover veículo"
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
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
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
