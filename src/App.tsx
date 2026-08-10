import React from 'react';
import { useValidatorController } from './hooks/useValidatorController';
import { ValidatorWorkspace } from './components/ValidatorWorkspace';
import DiagnosticPage from './DiagnosticPage';

export default function App() {
  if (window.location.pathname === '/diagnostic') {
    return <DiagnosticPage />;
  }

  const controller = useValidatorController();
  return <ValidatorWorkspace controller={controller} />;
}
