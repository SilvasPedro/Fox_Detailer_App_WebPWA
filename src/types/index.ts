export type AppointmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  userId: string;
  clientName: string;
  clientPhone?: string;
  vehicleModel: string;
  vehiclePlate?: string;
  serviceType: string;
  serviceIds?: string[];
  subtotal?: number;
  discount?: number;
  price: number;
  scheduledDate: string; // ISO date or YYYY-MM-DDTHH:mm
  status: AppointmentStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DetailingService {
  id: string;
  userId: string;
  name: string;
  price: number;
  duration: string; // e.g. "1h 30min", "2h", "4h"
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';

export interface FinancialTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  status: TransactionStatus;
  appointmentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  vehicleModel: string; // Primary vehicle for display / compatibility
  vehicles?: string[]; // All vehicles associated with this client
  vehiclePlate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KPIStats {
  pendingAppointmentsCount: number;
  monthRevenue: number;
  monthExpenses: number;
  monthProfit: number;
  profitMargin: number;
  completedThisMonth: number;
}

export interface MonthlyChartPoint {
  label: string; // e.g., "Jan", "Sem 1", "01/09"
  revenue: number;
  expenses: number;
  profit: number;
}
