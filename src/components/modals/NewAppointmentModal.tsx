import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Car,
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  Users,
  Check,
  Phone,
  Sparkles,
  Percent,
  Clock,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createAppointment } from '../../services/appointmentService';
import { createTransaction } from '../../services/financeService';
import type { AppointmentStatus, Client, DetailingService } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  clients?: Client[];
  services?: DetailingService[];
}

export const NewAppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreated,
  clients = [],
  services = [],
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client Selection Mode: 'registered' (pick from list) or 'manual' (type in)
  const hasClients = clients.length > 0;
  const [clientMode, setClientMode] = useState<'registered' | 'manual'>('registered');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Client details
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Selected Services (Multiple Selection from Registered Services)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Manual fallback service if no services registered yet
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState('');

  // Discount states
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<string>('0');

  // Manual price override (if user wants to type directly)
  const [manualPriceOverride, setManualPriceOverride] = useState<string | null>(null);

  // Date, Status, Notes & Finance
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState<AppointmentStatus>('pending');
  const [notes, setNotes] = useState('');
  const [createFinancialEntry, setCreateFinancialEntry] = useState(true);

  // Initialize defaults on modal open
  useEffect(() => {
    if (isOpen) {
      if (clients.length > 0) {
        setClientMode('registered');
      } else {
        setClientMode('manual');
      }

      // Default select the first registered service if none selected
      if (services.length > 0 && selectedServiceIds.length === 0) {
        setSelectedServiceIds([services[0].id]);
      }
    }
  }, [isOpen, clients.length, services]);

  // Calculate Subtotal from chosen registered services
  const selectedServices = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const subtotal = useMemo(() => {
    if (services.length > 0) {
      return selectedServices.reduce((acc, s) => acc + s.price, 0);
    }
    return Number(customServicePrice) || 0;
  }, [services.length, selectedServices, customServicePrice]);

  // Calculate discount amount in R$
  const calculatedDiscountAmount = useMemo(() => {
    if (!hasDiscount) return 0;
    const val = Number(discountValue) || 0;
    if (val <= 0) return 0;

    if (discountType === 'percent') {
      return Math.min(subtotal, (subtotal * val) / 100);
    }
    return Math.min(subtotal, val);
  }, [hasDiscount, discountType, discountValue, subtotal]);

  // Final Price
  const finalPrice = useMemo(() => {
    if (manualPriceOverride !== null) {
      const parsed = Number(manualPriceOverride);
      return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return Math.max(0, subtotal - calculatedDiscountAmount);
  }, [subtotal, calculatedDiscountAmount, manualPriceOverride]);

  if (!isOpen) return null;

  // Toggle selection of a service
  const toggleService = (serviceId: string) => {
    setManualPriceOverride(null); // Reset manual price override to use service sum
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        if (prev.length === 1) return prev; // Keep at least one selected if possible
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  // Handle client selection from dropdown
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientName('');
      setClientPhone('');
      setVehicleModel('');
      setVehiclePlate('');
      return;
    }

    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientPhone(found.phone || '');
      // If client has multiple vehicles, pick first as default
      const defaultVehicle =
        found.vehicles && found.vehicles.length > 0
          ? found.vehicles[0]
          : found.vehicleModel || '';
      setVehicleModel(defaultVehicle);
      setVehiclePlate(found.vehiclePlate || '');
    }
  };

  const handleSwitchToManual = () => {
    setClientMode('manual');
    setSelectedClientId('');
  };

  const handleSwitchToRegistered = () => {
    setClientMode('registered');
    if (clients.length > 0 && !selectedClientId) {
      handleClientSelect(clients[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Service name composition
    let resolvedServiceName = '';
    if (services.length > 0) {
      if (selectedServices.length === 0) {
        setError('Por favor selecione pelo menos um serviço de detalhamento.');
        return;
      }
      resolvedServiceName = selectedServices.map((s) => s.name).join(' + ');
    } else {
      if (!customServiceName.trim()) {
        setError('Por favor informe o nome do serviço.');
        return;
      }
      resolvedServiceName = customServiceName.trim();
    }

    if (!clientName.trim() || !vehicleModel.trim()) {
      setError('Por favor preencha o nome do cliente e o veículo.');
      return;
    }

    if (finalPrice < 0) {
      setError('O valor do serviço não pode ser negativo.');
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
        serviceType: resolvedServiceName.slice(0, 200),
        serviceIds: selectedServiceIds,
        subtotal,
        discount: calculatedDiscountAmount,
        price: finalPrice,
        scheduledDate,
        status,
        notes: notes.trim(),
      });

      // If user requested automatic financial entry
      if (createFinancialEntry && appointmentId && finalPrice > 0) {
        await createTransaction({
          userId: user.uid,
          type: 'income',
          amount: finalPrice,
          category: 'Serviço',
          description: `${resolvedServiceName} - ${vehicleModel} (${clientName})`,
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

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-[#1A1A1E] border border-zinc-800 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 flex items-center justify-center text-[#FF6B00]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Novo Agendamento</h3>
            <p className="text-xs text-zinc-400">Cadastre serviços e valores para o veículo</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CLIENT SELECTOR SECTION */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Cliente & Veículo</span>
              </label>

              {/* Mode Switcher */}
              {hasClients ? (
                <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSwitchToRegistered}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      clientMode === 'registered'
                        ? 'bg-[#FF6B00] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Cadastrado
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToManual}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      clientMode === 'manual'
                        ? 'bg-[#FF6B00] text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Digitar Novo
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500 font-medium">
                  Modo Manual
                </span>
              )}
            </div>

            {/* If Registered Mode is active */}
            {clientMode === 'registered' && hasClients ? (
              <div className="space-y-2.5">
                <div>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6B00] transition cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900 text-zinc-400">
                      -- Selecione um cliente da lista ({clients.length}) --
                    </option>
                    {clients.map((c) => {
                      const vehCount = c.vehicles ? c.vehicles.length : 1;
                      const vehText =
                        vehCount > 1
                          ? `${vehCount} veículos (${c.vehicles![0]}...)`
                          : c.vehicleModel;
                      return (
                        <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                          {c.name} • {vehText}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Selected Client Summary Card */}
                {selectedClientId && selectedClient ? (
                  <div className="p-3 rounded-lg bg-[#1A1A1E] border border-zinc-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#FF6B00]" />
                        {clientName}
                      </span>
                      {clientPhone && (
                        <span className="text-zinc-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          {clientPhone}
                        </span>
                      )}
                    </div>

                    {/* If client has multiple vehicles, show dropdown selector */}
                    {selectedClient.vehicles && selectedClient.vehicles.length > 1 ? (
                      <div className="pt-2 border-t border-zinc-800/80">
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                          <Car className="w-3 h-3 text-[#FF6B00]" />
                          <span>Veículo a ser atendido nesta visita:</span>
                        </label>
                        <select
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-[#FF6B00] transition cursor-pointer"
                        >
                          {selectedClient.vehicles.map((v, i) => (
                            <option key={i} value={v} className="bg-zinc-900">
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-zinc-300 pt-1 border-t border-zinc-800/80">
                        <span className="flex items-center gap-1.5 text-zinc-300">
                          <Car className="w-3.5 h-3.5 text-[#FF6B00]" />
                          {vehicleModel}
                        </span>
                        {vehiclePlate && (
                          <span className="font-mono text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400">
                            {vehiclePlate}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">
                    Escolha o cliente acima para preencher automaticamente nome, telefone e carro.
                  </p>
                )}
              </div>
            ) : (
              /* If Manual Mode is active */
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Nome do Cliente *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Mendes"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Veículo / Modelo *
                    </label>
                    <div className="relative">
                      <Car className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Porsche 911 / BMW 320i"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Placa (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="ABC-1234"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-[#FF6B00] transition"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* REGISTERED SERVICES MULTI-SELECTION SECTION */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Serviços Cadastrados *</span>
                  {selectedServiceIds.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B00] text-white font-black">
                      {selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'selecionado' : 'selecionados'}
                    </span>
                  )}
                </label>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Clique para marcar um ou mais serviços para este agendamento
                </p>
              </div>
            </div>

            {services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {services.map((svc) => {
                  const isSelected = selectedServiceIds.includes(svc.id);
                  return (
                    <div
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer select-none flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#FF6B00]/15 border-[#FF6B00]/70 text-white shadow-sm'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate leading-tight">{svc.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span className="text-emerald-400 font-bold">{formatBRL(svc.price)}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {svc.duration}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                            : 'border-zinc-700 bg-zinc-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback if no services registered yet */
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Nenhum serviço cadastrado ainda no catálogo. Você pode digitar abaixo ou cadastrar na aba <strong>Serviços</strong>.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Nome do Serviço *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Polimento Técnico"
                      value={customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="350.00"
                      value={customServicePrice}
                      onChange={(e) => setCustomServicePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DISCOUNT & PRICING BREAKDOWN */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Desconto & Preço Final</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setHasDiscount(!hasDiscount);
                  if (hasDiscount) setDiscountValue('0');
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                  hasDiscount
                    ? 'bg-[#FF6B00] text-white shadow-sm'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Percent className="w-3 h-3" />
                <span>{hasDiscount ? 'Desconto Aplicado' : '+ Aplicar Desconto'}</span>
              </button>
            </div>

            {hasDiscount && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                        discountType === 'fixed'
                          ? 'bg-[#FF6B00] text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      R$ Fixo
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                        discountType === 'percent'
                          ? 'bg-[#FF6B00] text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      % Porcentagem
                    </button>
                  </div>

                  <div className="relative flex-1 max-w-[180px]">
                    <input
                      type="number"
                      step={discountType === 'fixed' ? '0.01' : '1'}
                      min="0"
                      max={discountType === 'percent' ? 100 : undefined}
                      value={discountValue}
                      onChange={(e) => {
                        setDiscountValue(e.target.value);
                        setManualPriceOverride(null);
                      }}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white font-bold text-right pr-8 focus:outline-none focus:border-[#FF6B00]"
                      placeholder="0"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs font-bold text-zinc-400">
                      {discountType === 'fixed' ? 'R$' : '%'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Summary Box */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Subtotal dos Serviços:</span>
                <span className="font-semibold text-zinc-200">{formatBRL(subtotal)}</span>
              </div>

              {hasDiscount && calculatedDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-rose-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Desconto Concedido:</span>
                  </span>
                  <span>- {formatBRL(calculatedDiscountAmount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm font-black">
                <span className="text-white">Total a Cobrar:</span>
                <span className="text-emerald-400 text-base">{formatBRL(finalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Date & Initial Status */}
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
          <div
            onClick={() => setCreateFinancialEntry(!createFinancialEntry)}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between select-none ${
              createFinancialEntry
                ? 'bg-[#FF6B00]/10 border-[#FF6B00]/50 shadow-md shadow-orange-950/20'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                  createFinancialEntry
                    ? 'bg-gradient-to-br from-[#FF6B00] to-[#E65A00] text-white shadow-md shadow-orange-600/30'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Registrar no Fluxo Financeiro</span>
                  {createFinancialEntry && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Automático
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  Lança receita de {formatBRL(finalPrice)} nas finanças ao salvar
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ml-3 ${
                createFinancialEntry
                  ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-sm shadow-orange-600/50'
                  : 'border-zinc-600 bg-zinc-800'
              }`}
            >
              {createFinancialEntry && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Submit buttons */}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E65A00] text-sm font-semibold text-white shadow-lg shadow-orange-600/20 hover:brightness-110 disabled:opacity-50 transition cursor-pointer active:scale-95"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Salvar Agendamento ({formatBRL(finalPrice)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
