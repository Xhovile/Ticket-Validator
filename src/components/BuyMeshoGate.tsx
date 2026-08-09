import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, LogIn, ScanLine, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import App from '../App';
import { auth } from '../firebase';
import { exchangeValidatorSession } from '../lib/buymeshoApi';

const DEFAULT_BUYMESHO_LOGIN_URL = 'https://buymesho.app/login';

function buildReturnUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function buildRedirectUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.searchParams.set('returnTo', buildReturnUrl());
  url.searchParams.set('client', 'ticket-validator');
  url.searchParams.set('mode', 'login');
  return url.toString();
}

function extractCallbackToken() {
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const hashParams = hash ? new URLSearchParams(hash) : new URLSearchParams();

  return (
    search.get('buymesho_session') ??
    search.get('token') ??
    search.get('access_token') ??
    search.get('id_token') ??
    hashParams.get('buymesho_session') ??
    hashParams.get('token') ??
    hashParams.get('access_token') ??
    hashParams.get('id_token') ??
    ''
  );
}

function clearTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('buymesho_session');
  url.searchParams.delete('token');
  url.searchParams.delete('access_token');
  url.searchParams.delete('id_token');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

function ActionButton({
  href,
  primary = false,
  icon,
  label,
  caption,
}: {
  href: string;
  primary?: boolean;
  icon: React.ReactNode;
  label: string;
  caption: string;
}) {
  const className = primary
    ? 'group flex w-full items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white px-4 py-4 text-left text-slate-950 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-slate-50'
    : 'group flex w-full items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-left text-white transition hover:-translate-y-0.5 hover:bg-white/10';

  return (
    <a href={href} className={className}>
      <div className={primary ? 'mt-0.5 text-slate-950' : 'mt-0.5 text-white'}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold tracking-tight">{label}</span>
          <ArrowRight className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${primary ? 'text-slate-950/70' : 'text-white/60'}`} />
        </div>
        <p className={primary ? 'mt-1 text-xs leading-5 text-slate-600' : 'mt-1 text-xs leading-5 text-white/60'}>{caption}</p>
      </div>
    </a>
  );
}

export default function BuyMeshoGate() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(auth.currentUser));
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  const loginUrl = useMemo(
    () => buildRedirectUrl(import.meta.env.VITE_BUYMESHO_LOGIN_URL?.trim() || DEFAULT_BUYMESHO_LOGIN_URL),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let callbackHandled = false;
    const callbackToken = extractCallbackToken();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      if (user) {
        setIsAuthenticated(true);
        setSessionError('');
        setCheckingSession(false);
        return;
      }

      if (callbackToken && !callbackHandled) {
        callbackHandled = true;
        clearTokenFromUrl();

        try {
          const exchange = await exchangeValidatorSession(callbackToken);
          if (cancelled) return;
          await signInWithCustomToken(auth, exchange.customToken);
          return;
        } catch (error) {
          console.error('Unable to exchange the BuyMesho session for Ticket Validator:', error);
          if (cancelled) return;

          const status = typeof (error as { status?: unknown })?.status === 'number'
            ? Number((error as { status?: number }).status)
            : null;

          setSessionError(
            status === 401 || status === 403
              ? 'BuyMesho could not authorize this Ticket Validator session. Please sign in again.'
              : 'We could not connect to BuyMesho right now. Please try again.',
          );
          setIsAuthenticated(false);
          setCheckingSession(false);
          return;
        }
      }

      setIsAuthenticated(false);
      setCheckingSession(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold">Restoring your session</p>
            <p className="mt-1 text-xs text-white/50">Preparing Ticket Validator...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && auth.currentUser) return <App />;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="w-full space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_rgba(255,255,255,0.05)_40%,_rgba(255,255,255,0.03)_100%)] p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg shadow-black/20">
                <ScanLine className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.35em] text-white/45">BuyMesho</div>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ticket Validator</h1>
              </div>
            </div>

            {sessionError && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="leading-5">{sessionError}</p>
              </div>
            )}

            <div className="mt-6">
              <ActionButton
                href={loginUrl}
                primary
                icon={<LogIn className="h-5 w-5" />}
                label="Sign in with BuyMesho"
                caption="Use your BuyMesho event creator account to continue."
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-medium tracking-wide text-white/40">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>SIMPLE & SECURE</span>
          </div>
          <div className="pt-5 text-center text-[11px] uppercase tracking-[0.22em] text-white/30">Access is tied to your BuyMesho session</div>
        </div>
      </div>
    </div>
  );
}
