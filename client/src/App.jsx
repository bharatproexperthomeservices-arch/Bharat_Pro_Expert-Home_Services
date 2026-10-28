import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { PartnersPage } from './pages/PartnersPage';
import { KycQueuePage } from './pages/KycQueuePage';
import { BookingsPage } from './pages/BookingsPage';
import { DispatchPage } from './pages/DispatchPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="kyc-queue" element={<KycQueuePage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="dispatch" element={<DispatchPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
