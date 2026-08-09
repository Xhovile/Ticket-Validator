import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  onIdTokenChanged,
  setPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDlT_IH_p6XBwEc_8gwG_2IWUXmcitAmLM',
  authDomain: 'campusmarket-da919.firebaseapp.com',
  projectId: 'campusmarket-da919',
  storageBucket: 'campusmarket-da919.firebasestorage.app',
  messagingSenderId: '558704099855',
  appId: '1:558704099855:web:6c7f6e50ba7cf1fc13597a',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Firebase Auth is the sole client-side session authority.
// Explicit LOCAL persistence keeps the authenticated user across refreshes
// and browser/tab close-and-reopen. Firebase also manages ID-token refresh.
void setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Unable to enable Firebase local auth persistence:', error);
});

// Keep Firebase's token lifecycle active without copying the token into a
// second application-managed cache.
onIdTokenChanged(auth, () => {
  // Intentionally empty. Firebase Auth remains the source of truth.
});

export async function getFreshIdToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return '';

  return user.getIdToken(forceRefresh);
}
