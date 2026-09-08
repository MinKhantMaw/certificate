/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { storage } from "./services/storage";

const Login = lazy(() =>
  import("./pages/Login").then(({ Login }) => ({ default: Login })),
);
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then(({ Dashboard }) => ({ default: Dashboard })),
);
const ImportExcel = lazy(() =>
  import("./pages/ImportExcel").then(({ ImportExcel }) => ({
    default: ImportExcel,
  })),
);
const ImportProgramSelect = lazy(() =>
  import("./pages/ImportProgramSelect").then(({ ImportProgramSelect }) => ({
    default: ImportProgramSelect,
  })),
);
const CertificateList = lazy(() =>
  import("./pages/CertificateList").then(({ CertificateList }) => ({
    default: CertificateList,
  })),
);
const CertificateDetail = lazy(() =>
  import("./pages/CertificateDetail").then(({ CertificateDetail }) => ({
    default: CertificateDetail,
  })),
);
const ImportHistory = lazy(() =>
  import("./pages/ImportHistory").then(({ ImportHistory }) => ({
    default: ImportHistory,
  })),
);
const VerifyCertificate = lazy(() =>
  import("./pages/VerifyCertificate").then(({ VerifyCertificate }) => ({
    default: VerifyCertificate,
  })),
);
const TrainingPrograms = lazy(() =>
  import("./pages/TrainingPrograms").then(({ TrainingPrograms }) => ({
    default: TrainingPrograms,
  })),
);
const CertificateTemplates = lazy(() =>
  import("./pages/CertificateTemplates").then(({ CertificateTemplates }) => ({
    default: CertificateTemplates,
  })),
);
const Approvals = lazy(() =>
  import("./pages/Approvals").then(({ Approvals }) => ({ default: Approvals })),
);
const SignatureProfile = lazy(() =>
  import("./pages/SignatureProfile").then(({ SignatureProfile }) => ({
    default: SignatureProfile,
  })),
);
const TrainingProgramDetail = lazy(() =>
  import("./pages/TrainingProgramDetail").then(({ TrainingProgramDetail }) => ({
    default: TrainingProgramDetail,
  })),
);
const ImportApprovals = lazy(() =>
  import("./pages/ImportApprovals").then(({ ImportApprovals }) => ({
    default: ImportApprovals,
  })),
);
const ImportApprovalDetail = lazy(() =>
  import("./pages/ImportApprovalDetail").then(({ ImportApprovalDetail }) => ({
    default: ImportApprovalDetail,
  })),
);

export default function App() {
  useEffect(() => {
    storage.initDemoData();
  }, []);

  return (
    <Router>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
            Loading...
          </div>
        }
      >
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
      </Suspense>
    </Router>
  );
}
