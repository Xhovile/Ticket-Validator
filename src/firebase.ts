import { initializeApp } from 'firebase/app';
import { getAuth, onIdTokenChanged, type User } from 'firebase/auth';

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

let latestIdToken = '';

export function getLatestIdToken() {
  return latestIdToken;
}

export function setLatestIdToken(token: string) {
  latestIdToken = token;
}

export async function getFreshIdToken(user: User | null = auth.currentUser) {
  if (!user) return '';
  const token = await user.getIdToken();
  latestIdToken = token;
  return token;
}

// Firebase Auth owns persistence and refresh. Keep the API layer's
// synchronous token cache aligned with Firebase's current ID token.
onIdTokenChanged(auth, async (user) => {
  if (!user) {
    latestIdToken = '';
    return;
  }

  try {
    latestIdToken = await user.getIdToken();
  } catch {
    latestIdToken = '';
  }
});
