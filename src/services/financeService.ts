import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase/firestoreError';
import type {
  FinancialTransaction,
  KPIStats,
  MonthlyChartPoint,
  Appointment,
} from '../types';

const COLLECTION_NAME = 'financial_transactions';

export function subscribeTransactions(
  userId: string,
  onUpdate: (transactions: FinancialTransaction[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions: FinancialTransaction[] = [];
      snapshot.forEach((docSnap) => {
        transactions.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<FinancialTransaction, 'id'>),
        });
      });

      // Sort by date descending
      transactions.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      onUpdate(transactions);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    }
  );
}

export async function createTransaction(
  data: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const cleanPayload = {
    userId: data.userId,
    type: data.type,
    amount: Math.max(0, Number(data.amount) || 0),
    category: data.category.trim().slice(0, 60),
    description: data.description.trim().slice(0, 200),
    date: data.date.slice(0, 40),
    status: data.status,
    ...(data.appointmentId ? { appointmentId: data.appointmentId } : {}),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanPayload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${transactionId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, transactionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Compute dynamic KPI metrics for current month
export function calculateKPIs(
  transactions: FinancialTransaction[],
  appointments: Appointment[]
): KPIStats {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Filter current month transactions
  const thisMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const monthRevenue = thisMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthExpenses = thisMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthProfit = monthRevenue - monthExpenses;
  const profitMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

  // Pending appointments count
  const pendingAppointmentsCount = appointments.filter(
    (a) => a.status === 'pending'
  ).length;

  const completedThisMonth = appointments.filter((a) => {
    const d = new Date(a.scheduledDate);
    return (
      a.status === 'completed' &&
      d.getFullYear() === currentYear &&
      d.getMonth() === currentMonth
    );
  }).length;

  return {
    pendingAppointmentsCount,
    monthRevenue,
    monthExpenses,
    monthProfit,
    profitMargin,
    completedThisMonth,
  };
}

// Group transactions into last 6 months for Recharts comparison
export function generateMonthlyChartData(
  transactions: FinancialTransaction[]
): MonthlyChartPoint[] {
  const monthNames = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];

  const now = new Date();
  const points: MonthlyChartPoint[] = [];

  // Generate last 6 months in chronological order
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const label = `${monthNames[targetMonth]}/${String(targetYear).slice(2)}`;

    const targetTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    const revenue = targetTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = targetTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = revenue - expenses;

    points.push({
      label,
      revenue,
      expenses,
      profit,
    });
  }

  return points;
}

// Seed realistic detailing transactions for instant onboarding demo
export async function seedInitialTransactions(userId: string): Promise<void> {
  const now = new Date();
  const formatDate = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const initialItems: Omit<
    FinancialTransaction,
    'id' | 'createdAt' | 'updatedAt'
  >[] = [
    {
      userId,
      type: 'income',
      amount: 2400,
      category: 'Serviço',
      description: 'Vitrificação Cerâmica 9H - Porsche 911',
      date: formatDate(1),
      status: 'paid',
    },
    {
      userId,
      type: 'income',
      amount: 850,
      category: 'Serviço',
      description: 'Detalhamento Técnico de Motor e Chassi - Hilux',
      date: formatDate(2),
      status: 'paid',
    },
    {
      userId,
      type: 'expense',
      amount: 480,
      category: 'Insumos',
      description: 'Coating Cerâmico Gyeon Q2 + Boinas de Polimento Meguiars',
      date: formatDate(3),
      status: 'paid',
    },
    {
      userId,
      type: 'income',
      amount: 680,
      category: 'Serviço',
      description: 'Higienização Interna Completa - Audi RS6',
      date: formatDate(5),
      status: 'paid',
    },
    {
      userId,
      type: 'expense',
      amount: 1200,
      category: 'Estrutura',
      description: 'Aluguel do Box de Estética & Energia Elétrica',
      date: formatDate(10),
      status: 'paid',
    },
    {
      userId,
      type: 'expense',
      amount: 220,
      category: 'Produtos',
      description: 'Shampoo Neutro Vonixx + Pano de Microfibra 1200GSM',
      date: formatDate(12),
      status: 'paid',
    },
    {
      userId,
      type: 'income',
      amount: 1550,
      category: 'Serviço',
      description: 'Polimento Comercial em 2 Etapas - BMW 320i',
      date: formatDate(15),
      status: 'paid',
    },
  ];

  for (const item of initialItems) {
    await createTransaction(item);
  }
}
