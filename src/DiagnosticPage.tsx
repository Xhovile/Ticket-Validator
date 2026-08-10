import { useMemo, useState } from 'react';
import { auth, getFreshIdToken } from './firebase';

type Check = { name: string; status: 'pending' | 'pass' | 'warn' | 'fail'; detail: string; data?: unknown };

const DEFAULT_BUYMESHO_LOGIN_URL = 'https://buymesho.app/login';

function JsonBlock({ value }: { value: unknown }) { return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.5 }}>{JSON.stringify(value, null, 2)}</pre>; }
function statusColor(status: Check['status']) { if (status === 'pass') return '#15803d'; if (status === 'warn') return '#a16207'; if (status === 'fail') return '#b91c1c'; return '#475569'; }

function extractCallbackToken() {
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  const hashParams = hash ? new URLSearchParams(hash) : new URLSearchParams();
  return search.get('buymesho_session') ?? search.get('token') ?? search.get('access_token') ?? search.get('id_token') ?? hashParams.get('buymesho_session') ?? hashParams.get('token') ?? hashParams.get('access_token') ?? hashParams.get('id_token') ?? '';
}

function buildLoginUrl() {
  const url = new URL(import.meta.env.VITE_BUYMESHO_LOGIN_URL?.trim() || DEFAULT_BUYMESHO_LOGIN_URL);
  url.searchParams.set('returnTo', `${window.location.origin}/diagnostic`);
  // BuyMesho's production login callback accepts the canonical validator client id.
  // The diagnostic is still identified by its /diagnostic return path.
  url.searchParams.set('client', 'ticket-validator');
  url.searchParams.set('mode', 'login');
  return url.toString();
}

async function request(path: string, token: string, init: RequestInit = {}) {
  const started = performance.now();
  const response = await fetch(path, { ...init, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }, cache: 'no-store' });
  const text = await response.text();
  let payload: unknown = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { raw: text }; }
  return { status: response.status, ok: response.ok, ms: Math.round(performance.now() - started), payload };
}

function redactSessionToken(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const copy = { ...(payload as Record<string, unknown>) };
  if (typeof copy.customToken === 'string') copy.customToken = '[REDACTED]';
  return copy;
}

export default function DiagnosticPage() {
  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [startedAt, setStartedAt] = useState('');
  const loginUrl = useMemo(buildLoginUrl, []);

  const runDiagnostic = async () => {
    setRunning(true); setChecks([]); setStartedAt(new Date().toISOString());
    const next: Check[] = [];
    const push = (check: Check) => { next.push(check); setChecks([...next]); };

    const callbackToken = extractCallbackToken();
    if (callbackToken) {
      try {
        const sessionResult = await request('/api/validator/session', callbackToken, { method: 'POST', body: JSON.stringify({}) });
        const payload = sessionResult.payload as any;
        const customTokenReturned = typeof payload?.customToken === 'string' && payload.customToken.length > 0;
        push({
          name: 'POST /api/validator/session using BuyMesho callback',
          status: sessionResult.ok && customTokenReturned ? 'pass' : sessionResult.status === 401 || sessionResult.status === 403 || sessionResult.status === 404 || sessionResult.status >= 500 ? 'fail' : 'warn',
          detail: `HTTP ${sessionResult.status} in ${sessionResult.ms}ms. ${customTokenReturned ? 'BuyMesho accepted the callback token and returned a custom session token.' : 'No custom session token was returned.'}`,
          data: redactSessionToken(payload),
        });
      } catch (error) {
        push({ name: 'POST /api/validator/session using BuyMesho callback', status: 'fail', detail: error instanceof Error ? error.message : String(error) });
      }
    } else {
      push({ name: 'BuyMesho callback token', status: 'warn', detail: 'No BuyMesho callback token is present. Use “Sign in to diagnostic”, complete BuyMesho login, and return here before running the diagnostic.' });
    }

    const user = auth.currentUser;
    if (!user) {
      push({ name: 'Firebase authentication', status: 'warn', detail: 'No Firebase user is signed in in this browser yet. This is expected before Ticket Validator completes the custom-token exchange.' });
      setRunning(false);
      return;
    }

    push({ name: 'Firebase authentication', status: 'pass', detail: `Signed in as ${user.email || '(no email)'}; UID ${user.uid}.`, data: { uid: user.uid, email: user.email, emailVerified: user.emailVerified, origin: window.location.origin } });

    let token = '';
    try { token = await getFreshIdToken(false); push({ name: 'Fresh Firebase ID token', status: token ? 'pass' : 'fail', detail: token ? 'A fresh Firebase ID token was obtained. The token itself is never displayed.' : 'Firebase returned an empty token.' }); }
    catch (error) { push({ name: 'Fresh Firebase ID token', status: 'fail', detail: error instanceof Error ? error.message : String(error) }); setRunning(false); return; }

    const meResult = await request('/api/validator/me', token);
    const me = meResult.payload as any;
    const identityUid = typeof me?.identity?.uid === 'string' ? me.identity.uid : '';
    const events = Array.isArray(me?.events) ? me.events : [];
    const access = me?.access_scope || {};
    const uidMatches = identityUid === user.uid;
    push({ name: 'GET /api/validator/me', status: meResult.ok && uidMatches ? 'pass' : meResult.ok ? 'warn' : 'fail', detail: meResult.ok ? `HTTP ${meResult.status} in ${meResult.ms}ms. Backend identity UID ${identityUid || '(missing)'} ${uidMatches ? 'matches' : 'does NOT match'} browser Firebase UID.` : `HTTP ${meResult.status} in ${meResult.ms}ms.`, data: me });
    push({ name: 'Validator access scope', status: access?.can_validate_tickets ? 'pass' : 'fail', detail: `can_validate_tickets=${String(access?.can_validate_tickets)}; role=${String(access?.role || '(missing)')}; allowed_event_ids=${Array.isArray(access?.allowed_event_ids) ? access.allowed_event_ids.length : '(missing)'}.`, data: access });
    push({ name: 'Events returned by /api/validator/me', status: events.length > 0 ? 'pass' : 'fail', detail: `${events.length} event(s) returned for this authenticated session.`, data: events });
    try { const eventsResult = await request('/api/validator/events', token); push({ name: 'GET /api/validator/events', status: eventsResult.ok ? 'pass' : 'fail', detail: `HTTP ${eventsResult.status} in ${eventsResult.ms}ms.`, data: eventsResult.payload }); }
    catch (error) { push({ name: 'GET /api/validator/events', status: 'warn', detail: `Request could not be completed: ${error instanceof Error ? error.message : String(error)}` }); }
    if (events.length === 0) push({ name: 'Ticket endpoint test', status: 'warn', detail: 'Skipped because /api/validator/me returned no events.' });
    else for (const event of events.slice(0, 10)) { const eventId = String(event?.id ?? ''); if (!eventId) continue; try { const ticketResult = await request(`/api/validator/public/events/${encodeURIComponent(eventId)}/tickets`, token); const tickets = Array.isArray((ticketResult.payload as any)?.tickets) ? (ticketResult.payload as any).tickets : []; push({ name: `Tickets for event ${eventId}`, status: ticketResult.ok ? 'pass' : 'fail', detail: `HTTP ${ticketResult.status}; ${tickets.length} ticket(s); ${ticketResult.ms}ms.`, data: ticketResult.payload }); } catch (error) { push({ name: `Tickets for event ${eventId}`, status: 'fail', detail: error instanceof Error ? error.message : String(error) }); } }
    push({ name: 'Browser environment', status: navigator.onLine ? 'pass' : 'fail', detail: `Online=${navigator.onLine}; origin=${window.location.origin}; path=${window.location.pathname}.`, data: { userAgent: navigator.userAgent, online: navigator.onLine } });
    setRunning(false);
  };

  return <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}><div style={{ maxWidth: 1000, margin: '0 auto' }}><div style={{ marginBottom: 24 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}><div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b' }}>BuyMesho × Ticket Validator</div><h1 style={{ margin: '6px 0', fontSize: 28 }}>Browser Data-Flow Diagnostic</h1><p style={{ margin: 0, color: '#475569' }}>Tests the BuyMesho callback-token exchange before Firebase session creation, then verifies the authenticated Validator API.</p></div><button onClick={() => { window.location.href = loginUrl; }} style={{ border: 0, borderRadius: 10, padding: '12px 18px', fontWeight: 800, cursor: 'pointer', background: '#0f172a', color: 'white' }}>Sign in to diagnostic</button></div><button onClick={runDiagnostic} disabled={running} style={{ marginTop: 14, border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 16px', fontWeight: 800, cursor: running ? 'wait' : 'pointer', background: 'white', color: '#0f172a' }}>{running ? 'Running…' : 'Run diagnostic'}</button></div>{checks.length > 0 && <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>{['PASS','WARN','FAIL'].map((label) => <span key={label} style={{ border: '1px solid #e2e8f0', borderRadius: 999, padding: '5px 9px', background: 'white', fontSize: 12, fontWeight: 800 }}>{label} {checks.filter(c => c.status === label.toLowerCase()).length}</span>)}<span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>Started {startedAt}</span></div>}<div style={{ display: 'grid', gap: 12 }}>{checks.map((check, index) => <section key={`${check.name}-${index}`} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, boxShadow: '0 1px 2px rgba(15,23,42,.04)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}><h2 style={{ margin: 0, fontSize: 16 }}>{check.name}</h2><strong style={{ color: statusColor(check.status), fontSize: 12, textTransform: 'uppercase' }}>{check.status}</strong></div><p style={{ margin: '8px 0 0', color: '#475569', fontSize: 14 }}>{check.detail}</p>{check.data !== undefined && <details style={{ marginTop: 12 }}><summary style={{ cursor: 'pointer', color: '#334155', fontWeight: 700, fontSize: 13 }}>Show response data</summary><div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: '#f1f5f9', overflow: 'auto' }}><JsonBlock value={check.data} /></div></details>}</section>)}</div>{checks.length === 0 && <div style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: 14, padding: 32, textAlign: 'center', color: '#64748b' }}>Use <strong>Sign in to diagnostic</strong>, complete BuyMesho login, return here, then press <strong>Run diagnostic</strong>.</div>}</div></main>;
}