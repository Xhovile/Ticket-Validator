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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold">Verifying BuyMesho access</p>
            <p className="mt-1 text-xs text-slate-500">Preparing Ticket Validator...</p>
          </div>
        </div>
      </div>
    );
  }

  if (authError || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header
          user={null}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          activeSession={null}
          isHighContrast={isHighContrast}
          onToggleHighContrast={toggleHighContrast}
        />
        <main className="min-h-[75vh] flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Access unavailable</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {authError || 'Your BuyMesho account could not be verified.'}
            </p>
            <button
              type="button"
              onClick={() => {
                clearToken();
                window.location.reload();
              }}
              className="mt-5 min-h-[44px] w-full rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Return to BuyMesho Sign In
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        activeSession={activeSession}
        activeEventName={selectedEvent?.name}
        isHighContrast={isHighContrast}
        onToggleHighContrast={toggleHighContrast}
      />

      <OfflineSyncBanner
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        queuedItems={offlineQueue}
        isSyncing={isSyncing}
        onToggleSimulatedOffline={() => setIsSimulatedOffline((previous) => !previous)}
        onSyncNow={handleSyncNow}
        onClearQueue={() => {
          clearOfflineQueue();
          setOfflineQueue([]);
        }}
      />

      {syncToastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-400 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{syncToastMessage}</span>
        </div>
      )}

      <main className="transition-all duration-200">
        {currentTab === 'events' && (
          <>
            {viewState === 'list' || !selectedEvent ? (
              <EventsView
                user={currentUser}
                events={events}
                selectedEvent={selectedEvent}
                onSelectEvent={handleSelectEvent}
                permissionError={permissionError}
                onClearPermissionError={() => setPermissionError(null)}
              />
            ) : (
              <EventDetailView
                event={selectedEvent}
                isLoading={isDetailLoading}
                onBack={() => setViewState('list')}
                onStartScanning={() => {
                  if (activeSession && activeSession.active && activeSession.eventId === selectedEvent.id) {
                    setCurrentTab('scan');
                  } else {
                    setShowSessionModal(true);
                  }
                }}
                onViewAttendees={() => {
                  setCurrentTab('attendees');
                  setIsAttendeesLoading(true);
                  setTimeout(() => setIsAttendeesLoading(false), 300);
                }}
                activeSession={activeSession}
              />
            )}
          </>
        )}

        {currentTab === 'scan' && selectedEvent && (
          <ScannerView
            event={selectedEvent}
            session={activeSession}
            tickets={tickets}
            onScanTicket={handleScanTicket}
            onBackToEvent={() => setCurrentTab('events')}
            onStartSessionRequest={() => setShowSessionModal(true)}
            isContinuousScan={isContinuousScan}
            onToggleContinuousScan={() => setIsContinuousScan((previous) => !previous)}
          />
        )}

        {currentTab === 'attendees' && selectedEvent && (
          <AttendeesView
            event={selectedEvent}
            tickets={tickets}
            isLoading={isAttendeesLoading || isTicketsLoading}
            onSelectTicket={(ticket) => setSelectedTicketForDetail(ticket)}
            onUpdateStatusDirect={(ticketId, status) => {
              updateTicketStatus(ticketId, status);
              soundFX.playClick();
            }}
          />
        )}
      </main>

      {activeScanResult && (
        <ScanResultCard
          ticket={activeScanResult.ticket}
          scanTime={activeScanResult.scanTime}
          isDuplicateScan={activeScanResult.isDuplicate}
          isOfflineQueued={activeScanResult.isOfflineQueued}
          isContinuousMode={isContinuousScan}
          onUpdateStatus={(newStatus) => {
            updateTicketStatus(activeScanResult.ticket.id, newStatus);
            handleDismissResult();
            soundFX.playClick();
          }}
          onDismiss={handleDismissResult}
        />
      )}

      {showSessionModal && selectedEvent && (
        <CheckInSessionModal
          event={selectedEvent}
          user={currentUser}
          onClose={() => setShowSessionModal(false)}
          onConfirmStartSession={handleStartSessionConfirm}
        />
      )}

      {selectedTicketForDetail && (
        <TicketDetailModal
          ticket={selectedTicketForDetail}
          onClose={() => setSelectedTicketForDetail(null)}
          onUpdateStatus={(ticketId, newStatus) => {
            updateTicketStatus(ticketId, newStatus);
            soundFX.playClick();
          }}
        />
      )}

      <FooterNavigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'attendees' && currentTab !== 'attendees') {
            setIsAttendeesLoading(true);
            setTimeout(() => setIsAttendeesLoading(false), 300);
          }
          setCurrentTab(tab);
          setPermissionError(null);
        }}
        isScanningActive={Boolean(activeSession && activeSession.active)}
        hasActiveEvent={Boolean(selectedEvent)}
      />
    </div>
  );
}
