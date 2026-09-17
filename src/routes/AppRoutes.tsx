import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";

const Login = lazy(() =>
  import("../pages/Login").then(({ Login }) => ({ default: Login })),
);
const Dashboard = lazy(() =>
  import("../pages/Dashboard").then(({ Dashboard }) => ({
    default: Dashboard,
  })),
);
const ImportExcel = lazy(() =>
  import("../pages/ImportExcel").then(({ ImportExcel }) => ({
    default: ImportExcel,
  })),
);
const DocumentList = lazy(() =>
  import("../pages/DocumentList").then(({ DocumentList }) => ({
    default: DocumentList,
  })),
);
const DocumentDetail = lazy(() =>
  import("../pages/DocumentDetail").then(({ DocumentDetail }) => ({
    default: DocumentDetail,
  })),
);
const ImportHistory = lazy(() =>
  import("../pages/ImportHistory").then(({ ImportHistory }) => ({
    default: ImportHistory,
  })),
);
const VerifyDocument = lazy(() =>
  import("../pages/VerifyDocument").then(({ VerifyDocument }) => ({
    default: VerifyDocument,
  })),
);
const DocumentTemplates = lazy(() =>
  import("../pages/DocumentTemplates").then(({ DocumentTemplates }) => ({
    default: DocumentTemplates,
  })),
);
const TemplateDetail = lazy(() =>
  import("../pages/TemplateDetail").then(({ TemplateDetail }) => ({
    default: TemplateDetail,
  })),
);
const TemplateCreate = lazy(() =>
  import("../pages/TemplateCreate").then(({ TemplateCreate }) => ({
    default: TemplateCreate,
  })),
);
const Approvals = lazy(() =>
  import("../pages/Approvals").then(({ Approvals }) => ({
    default: Approvals,
  })),
);
const SignatureProfile = lazy(() =>
  import("../pages/SignatureProfile").then(({ SignatureProfile }) => ({
    default: SignatureProfile,
  })),
);
const Landing = lazy(() =>
  import("../pages/Landing").then(({ Landing }) => ({ default: Landing })),
);

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/verify/:verificationToken" element={<VerifyDocument />} />
      <Route path="/" element={<Landing />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="document-templates" element={<DocumentTemplates />} />
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

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
