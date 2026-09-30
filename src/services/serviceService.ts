import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase/firestoreError';
import type { DetailingService } from '../types';

const COLLECTION_NAME = 'services';

export const DEFAULT_DETAILING_SERVICES: Omit<DetailingService, 'id' | 'userId' | 'createdAt'>[] = [
  {
    name: 'Lavagem Essencial',
    price: 80,
    duration: '1h',
    description: 'Lavagem técnica da lataria, rodas e aspiração rápida.',
  },
  {
    name: 'Lavagem Detalhada Premium',
    price: 150,
    duration: '2h',
    description: 'Lavagem minuciosa com pincelamento de emblemas, caixas de roda e cera de proteção.',
  },
  {
    name: 'Correção de Pintura',
    price: 600,
    duration: '6h',
    description: 'Eliminação profunda de swirls, riscos médios e restauração de brilho.',
  },
  {
    name: 'Higienização de Estofados',
    price: 220,
    duration: '2h 30min',
    description: 'Higienização profunda por extração de bancos, teto e carpete.',
  },
  {
    name: 'Higienização de Bancos de Tecido',
    price: 180,
    duration: '2h',
    description: 'Limpeza e desinfecção com extratora profissional nos bancos de tecido.',
  },
  {
    name: 'Polimento Técnico',
    price: 700,
    duration: '8h',
    description: 'Etapas de corte, refino e lustro com nivelamento e brilho espelhado.',
  },
  {
    name: 'Vitrificação Cerâmica 9H',
    price: 1200,
    duration: '12h',
    description: 'Proteção nanotecnológica com dureza 9H e alta repelência hidrofóbica.',
  },
  {
    name: 'Detalhamento de Chassi e Motor',
    price: 250,
    duration: '2h',
    description: 'Limpeza técnica a vapor do cofre do motor e aplicação de verniz protetor.',
  },
  {
    name: 'Cristalização de Vidros',
    price: 120,
    duration: '1h',
    description: 'Remoção de marcas d água e aplicação de repelente de chuva de alta durabilidade.',
  },
];

function getLocalServices(userId: string): DetailingService[] {
  try {
    const raw = localStorage.getItem(`fox_services_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  // Default starter list
  return DEFAULT_DETAILING_SERVICES.map((s, idx) => ({
    id: `local_srv_${idx + 1}`,
    userId,
    ...s,
    createdAt: new Date().toISOString(),
  }));
}

function saveLocalServices(userId: string, services: DetailingService[]): void {
  try {
    localStorage.setItem(`fox_services_${userId}`, JSON.stringify(services));
  } catch {}
}

export function subscribeServices(
  userId: string,
  onUpdate: (services: DetailingService[]) => void,
  onError?: (err: unknown) => void
): () => void {
  let isUnmounted = false;

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (isUnmounted) return;
      const services: DetailingService[] = [];
      snapshot.forEach((docSnap) => {
        services.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<DetailingService, 'id'>),
        });
      });

      // Sort alphabetically by name
      services.sort((a, b) => a.name.localeCompare(b.name));

      if (services.length > 0) {
        saveLocalServices(userId, services);
        onUpdate(services);
      } else {
        // If Firestore collection has 0 items, check if we have local services or populate defaults
        const local = getLocalServices(userId);
        onUpdate(local);
      }
    },
    (error) => {
      if (isUnmounted) return;
      console.warn('Firestore /services permission/offline notice:', error);
      // Fallback to local storage so the application never breaks or throws uncaught error
      const local = getLocalServices(userId);
      onUpdate(local);
      if (onError) onError(error);
    }
  );

  return () => {
    isUnmounted = true;
    unsubscribe();
  };
}

export async function createService(
  data: Omit<DetailingService, 'id' | 'createdAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const cleanPayload = {
    userId: data.userId,
    name: data.name.trim().slice(0, 100),
    price: Math.max(0, Number(data.price)),
    duration: data.duration.trim().slice(0, 60),
    ...(data.description ? { description: data.description.trim().slice(0, 300) } : {}),
    createdAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanPayload);
    // Also sync local cache
    const current = getLocalServices(data.userId);
    current.push({ id: docRef.id, ...cleanPayload });
    saveLocalServices(data.userId, current);
    return docRef.id;
  } catch (error) {
    console.warn('Firestore createService rejected, persisting to local storage:', error);
    // Create in local storage so the user experience is smooth and uninterrupted
    const localId = `local_${Date.now()}`;
    const newService: DetailingService = {
      id: localId,
      ...cleanPayload,
    };
    const current = getLocalServices(data.userId);
    current.push(newService);
    saveLocalServices(data.userId, current);
    return localId;
  }
}

export async function updateService(
  serviceId: string,
  data: Partial<Omit<DetailingService, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const path = `${COLLECTION_NAME}/${serviceId}`;
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    updatedAt: now,
  };

  if (data.name !== undefined) updatePayload.name = data.name.trim().slice(0, 100);
  if (data.price !== undefined) updatePayload.price = Math.max(0, Number(data.price));
  if (data.duration !== undefined) updatePayload.duration = data.duration.trim().slice(0, 60);
  if (data.description !== undefined) {
    updatePayload.description = data.description.trim().slice(0, 300);
  }

  // Always update local cache first
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('fox_services_')) {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = list.findIndex((s: DetailingService) => s.id === serviceId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updatePayload };
          localStorage.setItem(key, JSON.stringify(list));
        }
      }
    }
  } catch {}

  // If this is a Firestore document ID (not local_), update Firestore
  if (!serviceId.startsWith('local_')) {
    try {
      const docRef = doc(db, COLLECTION_NAME, serviceId);
      await updateDoc(docRef, updatePayload);
    } catch (error) {
      console.warn('Firestore updateService rejected, saved to local cache:', error);
    }
  }
}

export async function deleteService(serviceId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${serviceId}`;

  // Always remove from local cache
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('fox_services_')) {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((s: DetailingService) => s.id !== serviceId);
        localStorage.setItem(key, JSON.stringify(filtered));
      }
    }
  } catch {}

  // If this is a Firestore document ID, delete from Firestore
  if (!serviceId.startsWith('local_')) {
    try {
      const docRef = doc(db, COLLECTION_NAME, serviceId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firestore deleteService rejected, removed from local cache:', error);
    }
  }
}

export async function seedInitialServices(userId: string): Promise<void> {
  for (const s of DEFAULT_DETAILING_SERVICES) {
    await createService({
      userId,
      ...s,
    });
  }
}
