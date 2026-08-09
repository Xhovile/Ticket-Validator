import { initializeApp } from 'firebase/app';
import { getAuth, onIdTokenChanged } from 'firebase/auth';

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
// Firebase persists the user session and automatically refreshes ID tokens.
// The application must not maintain a second authentication/session cache.
onIdTokenChanged(auth, () => {
  // Intentionally empty. Registering the listener keeps Firebase's auth
  // lifecycle active without duplicating its state anywhere else.
});

export async function getFreshIdToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return '';

  return user.getIdToken(forceRefresh);
}
