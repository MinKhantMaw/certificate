/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { storage } from "./services/storage";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  useEffect(() => {
    void Promise.all([storage.initTemplates(), storage.initDocuments()]);
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
        <AppRoutes />
      </Suspense>
    </Router>
  );
}
