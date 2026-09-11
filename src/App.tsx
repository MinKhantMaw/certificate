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
const DocumentList = lazy(() =>
  import("./pages/DocumentList").then(({ DocumentList }) => ({
    default: DocumentList,
  })),
);
const DocumentDetail = lazy(() =>
  import("./pages/DocumentDetail").then(({ DocumentDetail }) => ({
    default: DocumentDetail,
  })),
);
const ImportHistory = lazy(() =>
  import("./pages/ImportHistory").then(({ ImportHistory }) => ({
    default: ImportHistory,
  })),
);
const VerifyDocument = lazy(() =>
  import("./pages/VerifyDocument").then(({ VerifyDocument }) => ({
    default: VerifyDocument,
  })),
);
const DocumentTemplates = lazy(() =>
  import("./pages/DocumentTemplates").then(({ DocumentTemplates }) => ({
    default: DocumentTemplates,
  })),
);
const TemplateDetail = lazy(() =>
  import("./pages/TemplateDetail").then(({ TemplateDetail }) => ({
    default: TemplateDetail,
  })),
);
const TemplateCreate = lazy(() =>
  import("./pages/TemplateCreate").then(({ TemplateCreate }) => ({
    default: TemplateCreate,
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
            element={<VerifyDocument />}
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
            <Route
              path="document-templates"
              element={<DocumentTemplates />}
            />
            <Route path="document-templates/new" element={<TemplateCreate />} />
            <Route path="document-templates/:id" element={<TemplateDetail />} />
            <Route
              path="approvals"
              element={
                <ProtectedRoute roles={["APPROVER"]}>
                  <Approvals />
                </ProtectedRoute>
              }
            />
            <Route path="profile" element={<SignatureProfile />} />
            <Route path="import" element={<ImportExcel />} />
            <Route path="imports" element={<ImportHistory />} />
            <Route path="documents" element={<DocumentList />} />
            <Route path="documents/:id" element={<DocumentDetail />} />

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
