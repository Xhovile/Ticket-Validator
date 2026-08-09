import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, LogIn, ScanLine, ShieldCheck } from 'lucide-react';
import App from '../App';
import { clearToken, getStoredToken, saveToken } from '../lib/buymeshoApi';

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
      <div className={primary ? 'mt-0.5 text-slate-950' : 'mt-0.5 text-white'}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold tracking-tight">{label}</span>
          <ArrowRight
            className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${
              primary ? 'text-slate-950/70' : 'text-white/60'
            }`}
          />
        </div>

        <p
          className={
            primary
              ? 'mt-1 text-xs leading-5 text-slate-600'
              : 'mt-1 text-xs leading-5 text-white/60'
          }
        >
          {caption}
        </p>
      </div>
    </a>
  );
}

export default function BuyMeshoGate() {
  const [authToken, setAuthToken] = useState(() => getStoredToken());
  const [ready, setReady] = useState(() => Boolean(getStoredToken()));

  const loginUrl = useMemo(
    () =>
      buildRedirectUrl(
        import.meta.env.VITE_BUYMESHO_LOGIN_URL?.trim() ||
          'https://buymesho.vercel.app/login',
      ),
    [],
  );

  useEffect(() => {
    const token = extractCallbackToken();

    if (token) {
      saveToken(token);
      setAuthToken(token);
      setReady(true);
      clearTokenFromUrl();
      return;
    }

    const storedToken = getStoredToken();

    if (storedToken) {
      setAuthToken(storedToken);
      setReady(true);
      return;
    }

    clearToken();
    setReady(false);
  }, []);

  if (authToken && ready) {
    return <App />;
  }

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
                <div className="text-[10px] uppercase tracking-[0.35em] text-white/45">
                  BuyMesho
                </div>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                  Ticket Validator
                </h1>
              </div>
            </div>

            <div className="mt-6">
              <ActionButton
                href={loginUrl}
                primary
                icon={<LogIn className="h-5 w-5" />}
                label="Continue with BuyMesho"
                caption="Use your existing BuyMesho event creator account."
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-center text-xs font-medium tracking-wide text-white/60 shadow-sm">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>SIMPLE & SECURE</span>
          </div>

          <div className="text-center text-[11px] uppercase tracking-[0.22em] text-white/30">
            Access is tied to your BuyMesho session
          </div>
        </div>
      </div>
    </div>
  );
}
