import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Ticket Validator application error:', error, errorInfo);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-white px-5 text-slate-900">
        <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center">
          <section role="alertdialog" aria-labelledby="validator-error-title" aria-describedby="validator-error-description" className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 id="validator-error-title" className="mt-4 text-base font-semibold tracking-tight text-slate-950">Ticket Validator ran into an error</h1>
            <p id="validator-error-description" className="mt-2 text-sm leading-6 text-slate-500">Something went wrong while loading this screen. Reload the app and try again.</p>
            <button type="button" onClick={this.handleReload} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#020617] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload Ticket Validator
            </button>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">If the problem continues, close the app and open Ticket Validator again.</p>
          </section>
        </main>
      </div>
    );
  }
}
