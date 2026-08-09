import React from 'react';
import { useValidatorController } from './hooks/useValidatorController';
import { ValidatorWorkspace } from './components/ValidatorWorkspace';

export default function App() {
  const controller = useValidatorController();
  return <ValidatorWorkspace controller={controller} />;
}
