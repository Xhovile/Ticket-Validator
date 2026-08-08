import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, LogIn, ScanLine, ShieldCheck, UserPlus } from 'lucide-react';
import App from '../App';
import { User, UserRole } from '../types';

const VALIDATOR_USER_KEY = 'buymesho_validator_user';
const VALIDATOR_SESSION_KEY = 'buymesho_validator_session';
const AUTH_USER_KEY = 'buymesho_identity_user';
const AUTH_SESSION_KEY = 'buymesho_identity_session';
const API_BASE_URL = import.meta.env.VITE_BUYMESHO_API_BASE_URL?.trim() || 'https://buymesho.vercel.app';

declare global {
  interface Window {
    __buymeshoStoragePatched?: boolean;
  }
}

type ValidatorIdentity = {
  uid?: string;
  email?: string | null;
  email_verified?: boolean;
  is_admin?: boolean;
  display_name?: string | null;
  name?: string | null;
};

type ValidatorAccessScope = {
  can_validate_tickets?: boolean;
  can_manage_events?: boolean;
  assigned_event_ids?: unknown;
  event_ids?: unknown;
  assignedGate?: string | null;
  gate_name?: string | null;
};

type ValidatorMeResponse = {
  success?: boolean;
  identity?: ValidatorIdentity;
  validator_identity?: ValidatorIdentity;
  user?: ValidatorIdentity;
  access_scope?: ValidatorAccessScope;
  scope?: ValidatorAccessScope;
  session_token?: string | null;
};

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

function getLocationParams() {
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const hashParams = hash ? new URLSearchParams(hash) : new URLSearchParams();
  return { search, hashParams };
}

function readCallbackToken(): string | null {
  const { search, hashParams } = getLocationParams();
  return (
    search.get('buymesho_session') ??
    search.get('token') ??
    search.get('id_token') ??
    search.get('session') ??
    hashParams.get('buymesho_session') ??
    hashParams.get('token') ??
    hashParams.get('id_token') ??
    hashParams.get('session') ??
    null
  );
}

function readStoredAuthUser(): User | null {
  try {
    const rawUser = localStorage.getItem(AUTH_USER_KEY) ?? localStorage.getItem(VALIDATOR_USER_KEY);
    const rawSession = localStorage.getItem(AUTH_SESSION_KEY) ?? localStorage.getItem(VALIDATOR_SESSION_KEY);
    if (!rawUser || !rawSession) return null;
    return normalizeUser(JSON.parse(rawUser));
  } catch {
    return null;
  }
}

function clearAuthenticatedUser() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(VALIDATOR_USER_KEY);
  localStorage.removeItem(VALIDATOR_SESSION_KEY);
  window.dispatchEvent(new Event('buymesho-auth-change'));
}

function persistVerifiedSession(user: User, sessionToken: string) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(VALIDATOR_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_SESSION_KEY, sessionToken);
  localStorage.setItem(VALIDATOR_SESSION_KEY, sessionToken);
  window.dispatchEvent(new Event('buymesho-auth-change'));
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
    if ([AUTH_USER_KEY, AUTH_SESSION_KEY, VALIDATOR_USER_KEY, VALIDATOR_SESSION_KEY].includes(key)) {
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toValidatorUser(identity: ValidatorIdentity, scope: ValidatorAccessScope): User {
  const email = typeof identity.email === 'string' ? identity.email : '';
  const baseName = identity.display_name ?? identity.name ?? email.split('@')[0] ?? 'Verified Staff';
  const role: UserRole = identity.is_admin === true || scope.can_manage_events === true ? 'organizer' : 'gate_staff';

  return {
    id: identity.uid ?? email ?? 'buymesho-validator',
    name: baseName,
    email,
    role,
    assignedEventIds: stringArray(scope.assigned_event_ids ?? scope.event_ids),
    assignedGate: scope.assignedGate ?? scope.gate_name ?? undefined,
  };
}

async function exchangeCallbackToken(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/validator/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const rawText = await response.text();
  let payload: ValidatorMeResponse | null = null;

  try {
    payload = rawText ? (JSON.parse(rawText) as ValidatorMeResponse) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload
      ? String((payload as { message?: unknown }).message ?? 'Authentication failed')
      : 'BuyMesho rejected the token';
    throw new Error(message);
  }

  const identity = payload?.identity ?? payload?.validator_identity ?? payload?.user;
  const scope = payload?.access_scope ?? payload?.scope ?? {};

  if (!identity?.uid || !identity.email) {
    throw new Error('BuyMesho returned an incomplete identity');
  }

  return {
    user: toValidatorUser(identity, scope),
    sessionToken: payload?.session_token ?? token,
  };
}

function RedirectButton({
  children,
  href,
  primary = false,
}: {
  children: React.ReactNode;
  href: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={
        primary
          ? 'flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800'
          : 'flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50'
      }
    >
      {children}
    </a>
  );
}

patchStorageBridge();

export default function BuyMeshoGate() {
  const [authUser, setAuthUser] = useState<User | null>(() => readStoredAuthUser());
  const [loading, setLoading] = useState<boolean>(() => Boolean(readCallbackToken()) && !readStoredAuthUser());
  const [error, setError] = useState<string | null>(null);

  const loginUrl = useMemo(() => {
    return buildRedirectUrl(
      import.meta.env.VITE_BUYMESHO_LOGIN_URL?.trim() || 'https://buymesho.vercel.app/login',
      'login',
    );
  }, []);

  const signupUrl = useMemo(() => {
    return buildRedirectUrl(
      import.meta.env.VITE_BUYMESHO_SIGNUP_URL?.trim() || 'https://buymesho.vercel.app/signup',
      'signup',
    );
  }, []);

  useEffect(() => {
    const token = readCallbackToken();
    const storedUser = readStoredAuthUser();

    if (storedUser) {
      setAuthUser(storedUser);
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { user, sessionToken } = await exchangeCallbackToken(token);
        if (cancelled) return;

        persistVerifiedSession(user, sessionToken);
        setAuthUser(user);
        setError(null);
        setLoading(false);
        window.history.replaceState({}, '', buildReturnUrl());
      } catch (err) {
        if (cancelled) return;

        clearAuthenticatedUser();
        setAuthUser(null);
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onAuthChange = () => {
      const nextUser = readStoredAuthUser();
      setAuthUser(nextUser);
      if (!nextUser && !readCallbackToken()) {
        setError(null);
      }
    };

    window.addEventListener('buymesho-auth-change', onAuthChange);
    return () => window.removeEventListener('buymesho-auth-change', onAuthChange);
  }, []);

  const handleStart = () => {
    window.location.href = loginUrl;
  };

  const handleSignup = () => {
    window.location.href = signupUrl;
  };

  if (authUser) {
    return <App />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
              <ScanLine className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">BuyMesho identity required</div>
              <h1 className="text-2xl font-semibold tracking-tight">Verifying session</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Exchanging your BuyMesho callback token for a validator session.
          </p>
        </div>
      </div>
    );
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
            Only BuyMesho creators and approved gate staff can continue.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

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
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm text-white/65">
          <div className="mb-3 flex items-center gap-2 text-white">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Phase 1 bridge</span>
          </div>
          <ul className="space-y-2 leading-6">
            <li>• BuyMesho issues the identity.</li>
            <li>• Ticket Validator verifies the callback token with BuyMesho before opening the app.</li>
            <li>• Logout clears the cached session and returns to the BuyMesho handoff.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
