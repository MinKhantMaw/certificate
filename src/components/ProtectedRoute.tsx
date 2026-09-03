import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { storage } from '../services/storage';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = storage.getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
