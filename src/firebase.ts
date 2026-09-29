import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyDy6u_D8f-orOxLCngIdFTVmzEHi1Zhi10',
  authDomain: 'prodigy-31b57.firebaseapp.com',
  projectId: 'prodigy-31b57',
  storageBucket: 'prodigy-31b57.firebasestorage.app',
  messagingSenderId: '716571493228',
  appId: '1:716571493228:web:0d6233ff7ac8e183a4e949',
  measurementId: 'G-5PSZXCZCEJ',
};

// Initialize or retrieve existing app instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Configure session persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Failed to set auth persistence:', err);
});

// Validate connection to Firestore on app boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firebase Error: Please check your Firebase configuration or internet connection.');
    }
    return false;
  }
}

// Initial test trigger
testConnection();

export default app;
