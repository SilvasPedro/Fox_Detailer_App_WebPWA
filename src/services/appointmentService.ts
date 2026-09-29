import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firebase/firestoreError';
import type { Appointment, AppointmentStatus } from '../types';

const COLLECTION_NAME = 'appointments';

export function subscribeAppointments(
  userId: string,
  onUpdate: (appointments: Appointment[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const appointments: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        appointments.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Appointment, 'id'>),
        });
      });

      // Sort by scheduledDate descending
      appointments.sort((a, b) => {
        return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      });

      onUpdate(appointments);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    }
  );
}

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date().toISOString();
  // Sanitize and validate limits according to firebase-blueprint.json
  const cleanPayload = {
    userId: data.userId,
    clientName: data.clientName.trim().slice(0, 100),
    clientPhone: (data.clientPhone || '').trim().slice(0, 30),
    vehicleModel: data.vehicleModel.trim().slice(0, 100),
    vehiclePlate: (data.vehiclePlate || '').trim().toUpperCase().slice(0, 15),
    serviceType: data.serviceType.trim().slice(0, 100),
    price: Math.max(0, Number(data.price) || 0),
    scheduledDate: data.scheduledDate.slice(0, 40),
    status: data.status,
    notes: (data.notes || '').trim().slice(0, 500),
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

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus
): Promise<void> {
  const path = `${COLLECTION_NAME}/${appointmentId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, appointmentId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${appointmentId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, appointmentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Function to populate starter automotive detailing data for new users to test immediately
export async function seedInitialAppointments(userId: string): Promise<void> {
  const today = new Date();
  const formatOffset = (days: number, hours: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    d.setHours(hours, 0, 0, 0);
    return d.toISOString();
  };

  const initialItems: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      userId,
      clientName: 'Carlos Eduardo Mendes',
      clientPhone: '(11) 98765-4321',
      vehicleModel: 'Porsche 911 Carrera S',
      vehiclePlate: 'FOX-9110',
      serviceType: 'Polimento Técnico + Vitrificação Cerâmica',
      price: 2400,
      scheduledDate: formatOffset(0, 10), // Today at 10:00
      status: 'pending',
      notes: 'Cliente solicitou proteção de pintura premium de 3 anos e higienização interna de couro.',
    },
    {
      userId,
      clientName: 'Mariana Silveira',
      clientPhone: '(11) 97654-3210',
      vehicleModel: 'BMW M3 Competition',
      vehiclePlate: 'SPD-3030',
      serviceType: 'Lavagem Detalhada + Enceramento Nobre',
      price: 450,
      scheduledDate: formatOffset(1, 14), // Tomorrow at 14:00
      status: 'pending',
      notes: 'Cuidado extra com rodas aro 20 diamantadas e bancos em camurça.',
    },
    {
      userId,
      clientName: 'Fernando Albuquerque',
      clientPhone: '(11) 96543-2109',
      vehicleModel: 'Audi RS6 Avant',
      vehiclePlate: 'V8T-4040',
      serviceType: 'Higienização Interna + Oxi-sanitização',
      price: 680,
      scheduledDate: formatOffset(-1, 9),
      status: 'completed',
      notes: 'Carro entregue impecável com selante nos vidros.',
    },
    {
      userId,
      clientName: 'Rodrigo Antunes',
      clientPhone: '(11) 95432-1098',
      vehicleModel: 'Toyota Hilux GR-Sport',
      vehiclePlate: 'OFF-7788',
      serviceType: 'Detalhamento de Chassi e Motor + Lavagem Técnica',
      price: 850,
      scheduledDate: formatOffset(-2, 11),
      status: 'completed',
      notes: 'Remoção completa de barro e aplicação de verniz de motor protetivo.',
    },
  ];

  for (const item of initialItems) {
    await createAppointment(item);
  }
}
