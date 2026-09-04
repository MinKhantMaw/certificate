/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ImportExcel } from "./pages/ImportExcel";
import { ImportProgramSelect } from "./pages/ImportProgramSelect";
import { CertificateList } from "./pages/CertificateList";
import { CertificateDetail } from "./pages/CertificateDetail";
import { ImportHistory } from "./pages/ImportHistory";
import { VerifyCertificate } from "./pages/VerifyCertificate";
import { TrainingPrograms } from "./pages/TrainingPrograms";
import { CertificateTemplates } from "./pages/CertificateTemplates";
import { Approvals } from "./pages/Approvals";
import { SignatureProfile } from "./pages/SignatureProfile";
import { TrainingProgramDetail } from "./pages/TrainingProgramDetail";
import { ImportApprovals } from "./pages/ImportApprovals";
import { ImportApprovalDetail } from "./pages/ImportApprovalDetail";
import { storage } from "./services/storage";

export default function App() {
  useEffect(() => {
    storage.initDemoData();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes - Not protected by auth guard */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/verify/:verificationToken"
          element={<VerifyCertificate />}
        />

        {/* Protected Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="training-programs" element={<TrainingPrograms />} />
          <Route
            path="training-programs/:id/import"
            element={<ImportExcel />}
          />
          <Route
            path="training-programs/:id"
            element={<TrainingProgramDetail />}
          />
          <Route
            path="certificate-templates"
            element={<CertificateTemplates />}
          />
          <Route
            path="approvals"
            element={
              <ProtectedRoute roles={["APPROVER"]}>
                <Approvals />
              </ProtectedRoute>
            }
          />
          <Route
            path="approvals/imports"
            element={
              <ProtectedRoute roles={["APPROVER"]}>
                <ImportApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="approvals/imports/:id"
            element={
              <ProtectedRoute roles={["APPROVER"]}>
                <ImportApprovalDetail />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<SignatureProfile />} />
          <Route path="import" element={<ImportProgramSelect />} />
          <Route path="imports" element={<ImportHistory />} />
          <Route path="certificates" element={<CertificateList />} />
          <Route path="certificates/:id" element={<CertificateDetail />} />

          {/* Placeholder for unimplemented routes */}
          <Route
            path="users"
            element={
              <div className="p-8 text-center text-gray-500">
                Users Management (Coming Soon)
              </div>
            }
          />
          <Route
            path="settings"
            element={
              <div className="p-8 text-center text-gray-500">
                Settings (Coming Soon)
              </div>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
