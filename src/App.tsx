/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ImportExcel } from './pages/ImportExcel';
import { CertificateList } from './pages/CertificateList';
import { CertificateDetail } from './pages/CertificateDetail';
import { ImportHistory } from './pages/ImportHistory';
import { VerifyCertificate } from './pages/VerifyCertificate';
import { storage } from './services/storage';

export default function App() {
  useEffect(() => {
    storage.initDemoData();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes - Not protected by auth guard */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:verificationToken" element={<VerifyCertificate />} />

        {/* Protected Admin Routes */}
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="import" element={<ImportExcel />} />
          <Route path="imports" element={<ImportHistory />} />
          <Route path="certificates" element={<CertificateList />} />
          <Route path="certificates/:id" element={<CertificateDetail />} />
          
          {/* Placeholder for unimplemented routes */}
          <Route path="users" element={<div className="p-8 text-center text-gray-500">Users Management (Coming Soon)</div>} />
          <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings (Coming Soon)</div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
