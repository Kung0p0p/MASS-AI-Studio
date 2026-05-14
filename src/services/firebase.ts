import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Anonymous sign in for simplicity as per user request (logic same 100%)
export const initAuth = async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
};
