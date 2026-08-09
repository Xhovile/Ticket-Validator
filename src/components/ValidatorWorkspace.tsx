import React from 'react';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import type { ValidatorController } from '../hooks/useValidatorController';
import { Header } from './Header';
import { OfflineSyncBanner } from './OfflineSyncBanner';
import { FooterNavigation } from './FooterNavigation';
import { EventsView } from './EventsView';
import { EventDetailView } from './EventDetailView';
import { CheckInSessionModal } from './CheckInSessionModal';
import { ScannerView } from './ScannerView';
import { ScanResultCard } from './ScanResultCard';
import { AttendeesView } from './AttendeesView';
import { TicketDetailModal } from './TicketDetailModal';
import { soundFX } from '../utils/audio';
import { clearOfflineQueue } from '../utils/offlineSyncManager';
import { clearToken } from '../lib/buymeshoApi';

export function ValidatorWorkspace({ controller }: { controller: ValidatorController }) {
  const {
    currentUser, events, selectedEvent, tickets, activeSession, isAuthenticating, authError,
    isTicketsLoading, currentTab, viewState, permissionError, isDetailLoading, isAttendeesLoading,
    isHighContrast, showSessionModal, isContinuousScan, activeScanResult, selectedTicketForDetail,
    isOnline, isSimulatedOffline, offlineQueue, isSyncing, syncToastMessage,
    setCurrentTab, setViewState, setPermissionError, setIsAttendeesLoading, setIsSimulatedOffline,
    setOfflineQueue, setSelectedTicketForDetail, setShowSessionModal, setIsContinuousScan,
    handleSyncNow, handleSelectEvent, handleStartSessionConfirm, handleScanTicket, handleLogout,
    handleSwitchUser, toggleHighContrast, handleDismissResult, updateTicketStatus,
  } = controller;

  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6 text-zinc-900">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"><Loader2 className="h-5 w-5 animate-spin" /></div>
          <div><p className="text-sm font-semibold tracking-tight">Verifying BuyMesho access</p><p className="mt-1 text-xs text-zinc-500">Preparing Ticket Validator...</p></div>
        </div>
      </div>
    );
  }

  if (authError || !currentUser) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-zinc-900">
        <Header user={null} onLogout={handleLogout} onSwitchUser={handleSwitchUser} activeSession={null} isHighContrast={isHighContrast} onToggleHighContrast={toggleHighContrast} />
        <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md items-center justify-center px-5 py-10">
          <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldAlert className="h-5 w-5" /></div>
            <h2 className="mt-4 text-base font-semibold tracking-tight">Access unavailable</h2>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{authError || 'Your BuyMesho account could not be verified.'}</p>
            <button type="button" onClick={() => { clearToken(); window.location.reload(); }} className="mt-5 min-h-11 w-full rounded-xl bg-zinc-950 px-4 py-3 text-xs font-semibold text-white transition hover:bg-zinc-800">Return to BuyMesho Sign In</button>
          </div>
        </main>
      </div>
    );
  }

  const handleNavChange = (tab: 'events' | 'scan' | 'attendees') => {
    // Clicking the already-selected tab returns that section to its landing state.
    if (tab === currentTab) {
      if (tab === 'events') {
        setViewState('list');
      } else if (tab === 'scan') {
        handleDismissResult();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (tab === 'attendees') {
        setSelectedTicketForDetail(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setPermissionError(null);
      return;
    }

    if (tab === 'attendees') {
      setIsAttendeesLoading(true);
      setTimeout(() => setIsAttendeesLoading(false), 300);
    }
    setCurrentTab(tab);
    setPermissionError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-zinc-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <Header user={currentUser} onLogout={handleLogout} onSwitchUser={handleSwitchUser} activeSession={activeSession} activeEventName={selectedEvent?.name} isHighContrast={isHighContrast} onToggleHighContrast={toggleHighContrast} />

      <OfflineSyncBanner isOnline={isOnline} isSimulatedOffline={isSimulatedOffline} queuedItems={offlineQueue} isSyncing={isSyncing} onToggleSimulatedOffline={() => setIsSimulatedOffline((previous) => !previous)} onSyncNow={handleSyncNow} onClearQueue={() => { clearOfflineQueue(); setOfflineQueue([]); }} />

      {syncToastMessage && <div className="fixed left-1/2 top-[76px] z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-emerald-700 shadow-lg" role="status"><CheckCircle2 className="h-3.5 w-3.5" /><span>{syncToastMessage}</span></div>}

      <main className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-5xl px-3 pb-24 pt-3 transition-all duration-200 sm:px-5 sm:pb-28 sm:pt-5">
        {currentTab === 'events' && (
          <>{viewState === 'list' || !selectedEvent ? <EventsView user={currentUser} events={events} selectedEvent={selectedEvent} onSelectEvent={handleSelectEvent} permissionError={permissionError} onClearPermissionError={() => setPermissionError(null)} /> : <EventDetailView event={selectedEvent} isLoading={isDetailLoading} onBack={() => setViewState('list')} onStartScanning={() => { if (activeSession && activeSession.active && activeSession.eventId === selectedEvent.id) setCurrentTab('scan'); else setShowSessionModal(true); }} onViewAttendees={() => { setCurrentTab('attendees'); setIsAttendeesLoading(true); setTimeout(() => setIsAttendeesLoading(false), 300); }} activeSession={activeSession} />}</>
        )}
        {currentTab === 'scan' && selectedEvent && <ScannerView event={selectedEvent} session={activeSession} tickets={tickets} onScanTicket={handleScanTicket} onBackToEvent={() => setCurrentTab('events')} onStartSessionRequest={() => setShowSessionModal(true)} isContinuousScan={isContinuousScan} onToggleContinuousScan={() => setIsContinuousScan((previous) => !previous)} />}
        {currentTab === 'attendees' && selectedEvent && <AttendeesView event={selectedEvent} tickets={tickets} isLoading={isAttendeesLoading || isTicketsLoading} onSelectTicket={(ticket) => setSelectedTicketForDetail(ticket)} onUpdateStatusDirect={(ticketId, status) => { updateTicketStatus(ticketId, status); soundFX.playClick(); }} />}
      </main>

      {activeScanResult && <ScanResultCard ticket={activeScanResult.ticket} scanTime={activeScanResult.scanTime} isDuplicateScan={activeScanResult.isDuplicate} isOfflineQueued={activeScanResult.isOfflineQueued} isContinuousMode={isContinuousScan} onUpdateStatus={(newStatus) => { updateTicketStatus(activeScanResult.ticket.id, newStatus); handleDismissResult(); soundFX.playClick(); }} onDismiss={handleDismissResult} />}
      {showSessionModal && selectedEvent && <CheckInSessionModal event={selectedEvent} user={currentUser} onClose={() => setShowSessionModal(false)} onConfirmStartSession={handleStartSessionConfirm} />}
      {selectedTicketForDetail && <TicketDetailModal ticket={selectedTicketForDetail} onClose={() => setSelectedTicketForDetail(null)} onUpdateStatus={(ticketId, newStatus) => { updateTicketStatus(ticketId, newStatus); soundFX.playClick(); }} />}

      <FooterNavigation currentTab={currentTab} onTabChange={handleNavChange} isScanningActive={Boolean(activeSession && activeSession.active)} hasActiveEvent={Boolean(selectedEvent)} />
    </div>
  );
}
