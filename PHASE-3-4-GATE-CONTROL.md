# Ticket Validator — Phase 3 and Phase 4

This document turns Ticket Validator from a demo scanner into a real gate-control layer for BuyMesho.

## Phase 3: Validation Engine

This is the core of Ticket Validator.

### What it does

When a gate staff member scans a QR code, the app must:

1. Read the code.
2. Send it to the BuyMesho backend.
3. Fetch the ticket record.
4. Verify that the ticket belongs to the selected event.
5. Check the ticket status.
6. Return a clear result instantly.

### What the system should decide

The validator must return exactly one of these outcomes:

- Valid / Waiting Entry → allow entry
- Inside → already entered
- Outside → allowed to re-enter if re-entry is permitted
- Cancelled → deny entry
- Refunded → deny entry
- Blocked → deny entry
- Unknown / Invalid code → deny entry

### What gets updated

After a successful scan, the system should update:

- Ticket status
- Last scan time
- Gate name
- Staff name
- Event ID
- Audit log entry

That is what makes it authentic. Not just “the QR code scanned,” but the platform actually knows what happened.

### Why this phase matters

This is the part that gives Ticket Validator its value.

Without it, the app is only a camera reader.
With it, the app becomes a ticket authority.

### Phase 3 is complete when

- A scanned QR code returns the real ticket from BuyMesho.
- The result is shown immediately.
- The ticket status changes correctly.
- Duplicate scans are blocked.
- Every action is logged.

---

## Phase 4: Non-BuyMesho User Redirect and Access Control

This phase protects the ecosystem.

### What it does

Ticket Validator must not allow random public users to create accounts inside it. Instead:

- Only users already registered on BuyMesho can log in.
- Only event creators or approved staff can access the validator.
- Anyone else is redirected to BuyMesho sign-up or BuyMesho login.

### The logic

When someone opens Ticket Validator:

1. The app checks whether they have a BuyMesho account.
2. It checks whether they are an event creator or assigned staff.
3. If yes, they continue.
4. If no, they are sent to BuyMesho to sign up or sign in.

### Why this matters

This keeps the system clean.

It prevents:

- Duplicate user accounts
- Unauthorised access
- Confusion between BuyMesho accounts and validator accounts
- Fake gate access

### What this phase should also enforce

- No public registration form inside Ticket Validator
- No independent account creation
- No access to event data without BuyMesho authorization
- No event selection unless BuyMesho grants permission

### Phase 4 is complete when

- Non-BuyMesho users cannot log in.
- They are redirected properly.
- Only BuyMesho-linked creators/staff can reach the scanner.
- Access is based on BuyMesho identity and permissions.

---

## In one sentence

Phase 3 makes the scanner smart; Phase 4 makes the app secure and ecosystem-connected.

## Practical implementation checklist

- Add a BuyMesho validation endpoint for QR scans.
- Store and return ticket status from the backend.
- Log every scan with event ID, gate name, staff name, and timestamp.
- Block duplicate scans at the API and app levels.
- Remove any standalone public registration flow from Ticket Validator.
- Redirect unauthorised users to BuyMesho login or sign-up pages.
- Use BuyMesho identity and permissions as the only access gate for the validator.
