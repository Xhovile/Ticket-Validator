import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, LogIn, ScanLine, ShieldCheck, UserPlus } from 'lucide-react';
import App from '../App';
import { User, UserRole } from '../types';

const VALIDATOR_USER_KEY = 'buymesho_validator_user';
const VALIDATOR_SESSION_KEY = 'buymesho_validator_session';
const AUTH_USER_KEY = 'buymesho_identity_user';
const AUTH_SESSION_KEY = 'buymesho_identity_session';

declare global {
  interface Window {
    __buymeshoStoragePatched?: boolean;
  }
}

function isValidRole(role: unknown): role is UserRole {
  return role === 'organizer' || role === 'gate_staff';
}

function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Partial<User> & { role?: unknown; assignedEventIds?: unknown };
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string' || typeof candidate.email !== 'string') {
    return null;
  }

  if (!isValidRole(candidate.role)) return null;

  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    role: candidate.role,
    avatarUrl: typeof candidate.avatarUrl === 'string' ? candidate.avatarUrl : undefined,
    assignedEventIds: Array.isArray(candidate.assignedEventIds)
      ? candidate.assignedEventIds.filter((value): value is string => typeof value === 'string')
      : [],
    assignedGate: typeof candidate.assignedGate === 'string' ? candidate.assignedGate : undefined,
  };
}

function readStoredAuthUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY) ?? localStorage.getItem(VALIDATOR_USER_KEY);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

function storeAuthenticatedUser(user: User, sessionToken?: string) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(VALIDATOR_USER_KEY, JSON.stringify(user));

  if (sessionToken) {
    localStorage.setItem(AUTH_SESSION_KEY, sessionToken);
  }

  window.dispatchEvent(new Event('buymesho-auth-change'));
}

function clearAuthenticatedUser() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(VALIDATOR_USER_KEY);
  window.dispatchEvent(new Event('buymesho-auth-change'));
}

function buildReturnUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function buildRedirectUrl(baseUrl: string, mode: 'login' | 'signup') {
  const url = new URL(baseUrl);
  url.searchParams.set('returnTo', buildReturnUrl());
  url.searchParams.set('client', 'ticket-validator');
  url.searchParams.set('mode', mode);
  return url.toString();
}

function parseIncomingCallback(): { user: User | null; sessionToken: string | null } {
  const params = new URLSearchParams(window.location.search);
  const userParam = params.get('buymesho_user') ?? params.get('user');
  const tokenParam = params.get('buymesho_session') ?? params.get('session');

  if (!userParam) {
    return { user: null, sessionToken: tokenParam };
  }

  try {
    const decoded = userParam.startsWith('{') ? userParam : decodeURIComponent(userParam);
    const json = decoded.startsWith('{') ? decoded : atob(decoded);
    const parsed = JSON.parse(json);
    return { user: normalizeUser(parsed), sessionToken: tokenParam };
  } catch {
    return { user: null, sessionToken: tokenParam };
  }
}

function patchStorageBridge() {
  if (window.__buymeshoStoragePatched) return;

  const storageProto = Storage.prototype as Storage & {
    setItem: Storage['setItem'];
    removeItem: Storage['removeItem'];
  };

  const originalSetItem = storageProto.setItem;
  const originalRemoveItem = storageProto.removeItem;

  storageProto.setItem = function setItem(this: Storage, key: string, value: string) {
    originalSetItem.call(this, key, value);
    if ([AUTH_USER_KEY, AUTH_SESSION_KEY, VALIDATOR_USER_KEY].includes(key)) {
      window.dispatchEvent(new Event('buymesho-auth-change'));
    }
  };

  storageProto.removeItem = function removeItem(this: Storage, key: string) {
    originalRemoveItem.call(this, key);

    if (key === VALIDATOR_SESSION_KEY) {
      originalRemoveItem.call(this, AUTH_USER_KEY);
      originalRemoveItem.call(this, AUTH_SESSION_KEY);
      originalRemoveItem.call(this, VALIDATOR_USER_KEY);
      window.dispatchEvent(new Event('buymesho-auth-change'));
      return;
    }

    if ([AUTH_USER_KEY, AUTH_SESSION_KEY, VALIDATOR_USER_KEY].includes(key)) {
      window.dispatchEvent(new Event('buymesho-auth-change'));
    }
  };

  window.__buymeshoStoragePatched = true;
}

patchStorageBridge();

export default function BuyMeshoGate() {
  const [authUser, setAuthUser] = useState<User | null>(() => readStoredAuthUser());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const { user, sessionToken } = parseIncomingCallback();

    if (user) {
      storeAuthenticatedUser(user, sessionToken ?? 'buymesho-connected');
      setAuthUser(user);
      window.history.replaceState({}, '', buildReturnUrl());
      return;
    }

    const onAuthChange = () => {
      const nextUser = readStoredAuthUser();
      setAuthUser(nextUser);
      if (!nextUser) {
        setStatusMessage('Session ended. Use BuyMesho to sign in again.');
      }
    };

    onAuthChange();
    window.addEventListener('buymesho-auth-change', onAuthChange);

    return () => window.removeEventListener('buymesho-auth-change', onAuthChange);
  }, []);

  const loginUrl = useMemo(() => {
    return buildRedirectUrl(
      import.meta.env.VITE_BUYMESHO_AUTH_URL?.trim() || 'https://buymesho.com/creator/login',
      'login',
    );
  }, []);

  const signupUrl = useMemo(() => {
    return buildRedirectUrl(
      import.meta.env.VITE_BUYMESHO_SIGNUP_URL?.trim() || 'https://buymesho.com/creator/signup',
      'signup',
    );
  }, []);

  const handleStart = () => {
    setStatusMessage('Redirecting to BuyMesho sign-in...');
    window.location.href = loginUrl;
  };

  const handleSignup = () => {
    setStatusMessage('Redirecting to BuyMesho creator onboarding...');
    window.location.href = signupUrl;
  };

  if (authUser) {
    return <App />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
              <ScanLine className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">BuyMesho identity required</div>
              <h1 className="text-2xl font-semibold tracking-tight">Ticket Validator</h1>
            </div>
          </div>

          <p className="text-sm leading-6 text-white/70">
            This tool is only for BuyMesho event creators and approved gate staff. It does not create its own public
            accounts.
          </p>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white/90"
            >
              <LogIn className="h-4 w-4" />
              Continue with BuyMesho
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSignup}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <UserPlus className="h-4 w-4" />
              BuyMesho creator sign-up
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          {statusMessage && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/70">
              {statusMessage}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm text-white/65">
          <div className="mb-3 flex items-center gap-2 text-white">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Phase 1 in place</span>
          </div>
          <ul className="space-y-2 leading-6">
            <li>• BuyMesho is now the entry point.</li>
            <li>• No demo user list is shown on the public login path.</li>
            <li>• Logout clears the auth bridge and returns to BuyMesho.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
