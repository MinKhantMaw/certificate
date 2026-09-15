import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { storage } from "../services/storage";
import { api, apiEnabled } from "../services/api";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: string[];
}) {
  const [user, setUser] = useState(storage.getUser);
  const [checking, setChecking] = useState(apiEnabled);

  useEffect(() => {
    if (!apiEnabled) { setChecking(false); return; }
    let active = true;
    void api.me().then((remoteUser) => {
      storage.setSessionUser(remoteUser);
      if (active) setUser(remoteUser);
    }).catch(() => {
      storage.clearSession();
      if (active) setUser(null);
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">Checking session...</div>;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
