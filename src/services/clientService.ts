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
import type { Client } from '../types';

const COLLECTION_NAME = 'clients';

export function subscribeClients(
  userId: string,
  onUpdate: (clients: Client[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const clients: Client[] = [];
      snapshot.forEach((docSnap) => {
        clients.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Client, 'id'>),
        });
      });

      // Sort alphabetically by name
      clients.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(clients);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    }
  );
}

export async function createClient(
  data: Omit<Client, 'id' | 'createdAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const cleanVehicles = (data.vehicles || [])
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, 20);

  const primaryVehicle =
    cleanVehicles.length > 0 ? cleanVehicles[0] : (data.vehicleModel || '').trim();

  const cleanPayload = {
    userId: data.userId,
    name: data.name.trim().slice(0, 100),
    phone: data.phone.trim().slice(0, 30),
    ...(data.secondaryPhone ? { secondaryPhone: data.secondaryPhone.trim().slice(0, 30) } : {}),
    ...(data.email ? { email: data.email.trim().slice(0, 100) } : {}),
    vehicleModel: primaryVehicle.slice(0, 100),
    ...(cleanVehicles.length > 0 ? { vehicles: cleanVehicles } : {}),
    ...(data.vehiclePlate
      ? { vehiclePlate: data.vehiclePlate.trim().toUpperCase().slice(0, 15) }
      : {}),
    createdAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanPayload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
}

export async function updateClient(
  clientId: string,
  data: Partial<Omit<Client, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const path = `${COLLECTION_NAME}/${clientId}`;
  const now = new Date().toISOString();

  let cleanVehicles: string[] | undefined;
  if (data.vehicles) {
    cleanVehicles = data.vehicles
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 20);
  }

  const primaryVehicle =
    cleanVehicles && cleanVehicles.length > 0
      ? cleanVehicles[0]
      : data.vehicleModel
      ? data.vehicleModel.trim()
      : undefined;

  const updatePayload: Record<string, unknown> = {
    updatedAt: now,
  };

  if (data.name !== undefined) updatePayload.name = data.name.trim().slice(0, 100);
  if (data.phone !== undefined) updatePayload.phone = data.phone.trim().slice(0, 30);
  if (data.secondaryPhone !== undefined) {
    updatePayload.secondaryPhone = data.secondaryPhone.trim().slice(0, 30);
  }
  if (data.email !== undefined) updatePayload.email = data.email.trim().slice(0, 100);
  if (primaryVehicle !== undefined) updatePayload.vehicleModel = primaryVehicle.slice(0, 100);
  if (cleanVehicles !== undefined) updatePayload.vehicles = cleanVehicles;
  if (data.vehiclePlate !== undefined) {
    updatePayload.vehiclePlate = data.vehiclePlate.trim().toUpperCase().slice(0, 15);
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, clientId);
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${clientId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, clientId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedInitialClients(userId: string): Promise<void> {
  const sampleClients: Omit<Client, 'id' | 'createdAt'>[] = [
    {
      userId,
      name: 'Carlos Eduardo Mendes',
      phone: '(11) 98765-4321',
      email: 'carlos.mendes@email.com',
      vehicleModel: 'Porsche 911 Carrera S',
      vehiclePlate: 'FOX-9110',
    },
    {
      userId,
      name: 'Mariana Silveira',
      phone: '(11) 97654-3210',
      email: 'mariana.silveira@email.com',
      vehicleModel: 'BMW M3 Competition',
      vehiclePlate: 'SPD-3030',
    },
    {
      userId,
      name: 'Fernando Albuquerque',
      phone: '(11) 96543-2109',
      email: 'fernando.albuquerque@email.com',
      vehicleModel: 'Audi RS6 Avant',
      vehiclePlate: 'V8T-4040',
    },
  ];

  for (const c of sampleClients) {
    await createClient(c);
  }
}
