import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';

export type ValidatorAuthState =
  | 'restoring'
  | 'authenticated'
  | 'unauthenticated';

type ValidatorAuthContextValue = {
  state: ValidatorAuthState;
  firebaseUser: FirebaseUser | null;
};

const ValidatorAuthContext = createContext<ValidatorAuthContextValue | undefined>(undefined);

export function ValidatorAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ValidatorAuthState>('restoring');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    // onAuthStateChanged fires after Firebase has restored LOCAL persistence.
    // Until then, the application must render neither the Validator workspace
    // nor the BuyMesho login screen.
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setState(user ? 'authenticated' : 'unauthenticated');
    });
  }, []);

  const value = useMemo(
    () => ({ state, firebaseUser }),
    [state, firebaseUser],
  );

  return (
    <ValidatorAuthContext.Provider value={value}>
      {children}
    </ValidatorAuthContext.Provider>
  );
}

export function useValidatorAuth() {
  const context = useContext(ValidatorAuthContext);
  if (!context) {
    throw new Error('useValidatorAuth must be used inside ValidatorAuthProvider');
  }
  return context;
}
