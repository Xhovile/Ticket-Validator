import { useState } from 'react';
import { auth, getFreshIdToken } from './firebase';

type Check = {
  name: string;
  status: 'pending' | 'pass' | 'warn' | 'fail';
  detail: string;
  data?: unknown;
};

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.5 }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

async function request(path: string, token: string) {
  const started = performance.now();
  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  const text = await response.text();
  let payload: unknown = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { raw: text }; }
  return { status: response.status, ok: response.ok, ms: Math.round(performance.now() - started), payload };
}

function statusColor(status: Check['status']) {
  if (status === 'pass') return '#15803d';
  if (status === 'warn') return '#a16207';
  if (status === 'fail') return '#b91c1c';
  return '#475569';
}

export default function DiagnosticPage() {
  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [startedAt, setStartedAt] = useState<string>('');

  const runDiagnostic = async () => {
    setRunning(true);
    setChecks([]);
    setStartedAt(new Date().toISOString());
    const next: Check[] = [];
    const push = (check: Check) => {
      next.push(check);
      setChecks([...next]);
    };

    const user = auth.currentUser;
    if (!user) {
      push({ name: 'Firebase authentication', status: 'fail', detail: 'No Firebase user is signed in in this browser.' });
      setRunning(false);
      return;
    }

    push({
      name: 'Firebase authentication',
      status: 'pass',
      detail: `Signed in as ${user.email || '(no email)'}; UID ${user.uid}.`,
      data: { uid: user.uid, email: user.email, emailVerified: user.emailVerified, origin: window.location.origin },
    });

    let token = '';
    try {
      token = await getFreshIdToken(false);
      push({
        name: 'Fresh Firebase ID token',
        status: token ? 'pass' : 'fail',
        detail: token ? 'A fresh Firebase ID token was obtained. The token itself is never displayed.' : 'Firebase returned an empty token.',
      });
    } catch (error) {
      push({ name: 'Fresh Firebase ID token', status: 'fail', detail: error instanceof Error ? error.message : String(error) });
      setRunning(false);
      return;
    }

    const meResult = await request('/api/validator/me', token);
    const me = meResult.payload as any;
    const identityUid = typeof me?.identity?.uid === 'string' ? me.identity.uid : '';
    const events = Array.isArray(me?.events) ? me.events : [];
    const access = me?.access_scope || {};
    const uidMatches = identityUid === user.uid;
    const isAdmin = access?.role === 'admin' || access?.is_admin === true;

    push({
      name: 'GET /api/validator/me',
      status: meResult.ok && uidMatches ? 'pass' : meResult.ok ? 'warn' : 'fail',
      detail: meResult.ok
        ? `HTTP ${meResult.status} in ${meResult.ms}ms. Backend identity UID ${identityUid || '(missing)'} ${uidMatches ? 'matches' : 'does NOT match'} browser Firebase UID.`
        : `HTTP ${meResult.status} in ${meResult.ms}ms.`,
      data: me,
    });

    push({
      name: 'Validator access scope',
      status: access?.can_validate_tickets ? 'pass' : 'fail',
      detail: `can_validate_tickets=${String(access?.can_validate_tickets)}; role=${String(access?.role || '(missing)')}; allowed_event_ids=${Array.isArray(access?.allowed_event_ids) ? access.allowed_event_ids.length : '(missing)'}.`,
      data: access,
    });

    push({
      name: 'Events returned by /api/validator/me',
      status: events.length > 0 ? 'pass' : 'fail',
      detail: `${events.length} event(s) returned for this authenticated session.`,
      data: events,
    });

    try {
      const eventsResult = await request('/api/validator/events', token);
      push({
        name: 'GET /api/validator/events',
        status: eventsResult.ok ? 'pass' : 'fail',
        detail: `HTTP ${eventsResult.status} in ${eventsResult.ms}ms.`,
        data: eventsResult.payload,
      });
    } catch (error) {
      push({ name: 'GET /api/validator/events', status: 'warn', detail: `Request could not be completed: ${error instanceof Error ? error.message : String(error)}` });
    }

    if (events.length === 0) {
      push({
        name: 'Ticket endpoint test',
        status: 'warn',
        detail: 'Skipped because /api/validator/me returned no events. This is the key failure boundary to investigate first.',
      });
    } else {
      for (const event of events.slice(0, 10)) {
        const eventId = String(event?.id ?? '');
        if (!eventId) continue;
        try {
          const ticketResult = await request(`/api/validator/public/events/${encodeURIComponent(eventId)}/tickets`, token);
          const tickets = Array.isArray((ticketResult.payload as any)?.tickets) ? (ticketResult.payload as any).tickets : [];
          push({
            name: `Tickets for event ${eventId}`,
            status: ticketResult.ok ? 'pass' : 'fail',
            detail: `HTTP ${ticketResult.status}; ${tickets.length} ticket(s); ${ticketResult.ms}ms.`,
            data: ticketResult.payload,
          });
        } catch (error) {
          push({ name: `Tickets for event ${eventId}`, status: 'fail', detail: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    push({
      name: 'Browser environment',
      status: navigator.onLine ? 'pass' : 'fail',
      detail: `Online=${navigator.onLine}; origin=${window.location.origin}; path=${window.location.pathname}.`,
      data: { userAgent: navigator.userAgent, online: navigator.onLine },
    });

    setRunning(false);
  };

  const passCount = checks.filter((item) => item.status === 'pass').length;
  const failCount = checks.filter((item) => item.status === 'fail').length;
  const warnCount = checks.filter((item) => item.status === 'warn').length;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b' }}>BuyMesho × Ticket Validator</div>
            <h1 style={{ margin: '6px 0', fontSize: 28 }}>Browser Data-Flow Diagnostic</h1>
            <p style={{ margin: 0, color: '#475569' }}>This page checks authentication, Validator API responses, event ownership visibility, and ticket retrieval without exposing the Firebase token.</p>
          </div>
          <button onClick={runDiagnostic} disabled={running} style={{ border: 0, borderRadius: 10, padding: '12px 18px', fontWeight: 800, cursor: running ? 'wait' : 'pointer', background: '#0f172a', color: 'white' }}>
            {running ? 'Running…' : 'Run diagnostic'}
          </button>
        </div>

        {checks.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <Badge label={`PASS ${passCount}`} />
            <Badge label={`WARN ${warnCount}`} />
            <Badge label={`FAIL ${failCount}`} />
            {startedAt && <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>Started {startedAt}</span>}
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {checks.map((check, index) => (
            <section key={`${check.name}-${index}`} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, boxShadow: '0 1px 2px rgba(15,23,42,.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>{check.name}</h2>
                <strong style={{ color: statusColor(check.status), fontSize: 12, textTransform: 'uppercase' }}>{check.status}</strong>
              </div>
              <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 14 }}>{check.detail}</p>
              {check.data !== undefined && <details style={{ marginTop: 12 }}><summary style={{ cursor: 'pointer', color: '#334155', fontWeight: 700, fontSize: 13 }}>Show response data</summary><div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: '#f1f5f9', overflow: 'auto' }}><JsonBlock value={check.data} /></div></details>}
            </section>
          ))}
        </div>

        {checks.length === 0 && (
          <div style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: 14, padding: 32, textAlign: 'center', color: '#64748b' }}>
            Open this page while logged in to the affected account, then press <strong>Run diagnostic</strong>.
          </div>
        )}
      </div>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return <span style={{ border: '1px solid #e2e8f0', borderRadius: 999, padding: '5px 9px', background: 'white', fontSize: 12, fontWeight: 800 }}>{label}</span>;
}
