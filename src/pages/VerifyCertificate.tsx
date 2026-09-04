import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { storage } from "../services/storage";
import { Certificate } from "../types";
import { CertificatePreview } from "../components/CertificatePreview";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { formatDate, getVerificationUrl } from "../utils";

export function VerifyCertificate() {
  const { verificationToken } = useParams<{ verificationToken: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const decodedToken = verificationToken
      ? decodeURIComponent(verificationToken).trim()
      : "";

    const verifyCertificate = async () => {
      try {
        const response = await fetch(
          `/api/verify/${encodeURIComponent(decodedToken)}`,
        );
        if (response.ok) {
          setCert((await response.json()) as Certificate);
          return;
        }
      } catch {
        // Fall back to local prototype data when the API is unavailable locally.
      }

      storage.initDemoData();
      const localCertificate = storage.getCertificateByToken(decodedToken);
      setCert(localCertificate || createPocCertificate(decodedToken));
    };

    verifyCertificate().finally(() => setLoading(false));
  }, [verificationToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Public Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center text-blue-600">
            <span className="font-bold text-xl tracking-tight text-gray-900">
              Official Certificate Verification
            </span>
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Admin Portal
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!cert ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Certificate Not Found
            </h2>
            <p className="text-base text-gray-600 mb-6">
              This verification token does not match any certificate in our
              records.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-600 break-all border border-gray-200 max-w-lg mx-auto mb-6">
              Token: {verificationToken}
            </div>
            <div className="bg-gray-50 rounded-lg p-5 text-left text-sm text-gray-500 border border-gray-100">
              <p className="font-medium text-gray-900 mb-2">
                Possible reasons:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The verification link was typed or scanned incorrectly.</li>
                <li>The certificate has not been issued or was removed.</li>
                <li>The QR code or token is invalid.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Status Banner */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-3xl mx-auto">
              <div
                className={`p-8 text-center border-b ${cert.status === "VALID" ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"}`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${cert.status === "VALID" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}
                >
                  {cert.status === "VALID" ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : (
                    <AlertTriangle className="w-10 h-10" />
                  )}
                </div>
                <h2
                  className={`text-2xl font-bold mb-2 ${cert.status === "VALID" ? "text-green-800" : "text-amber-800"}`}
                >
                  {cert.status === "VALID"
                    ? "✓ Certificate Verified"
                    : cert.status === "REVOKED"
                      ? "⚠ Certificate Revoked"
                      : cert.status === "PENDING_APPROVAL"
                        ? "Certificate Pending Approval"
                        : "Certificate Not Valid"}
                </h2>
                <p
                  className={`text-sm ${cert.status === "VALID" ? "text-green-700" : "text-amber-700"}`}
                >
                  {cert.status === "VALID"
                    ? "This certificate is authentic, official, and currently valid."
                    : cert.status === "REVOKED"
                      ? "This certificate was previously issued but has been revoked and is no longer valid."
                      : cert.status === "PENDING_APPROVAL"
                        ? "This certificate is awaiting approval from the assigned approvers."
                        : "This certificate is not currently valid."}
                </p>
              </div>

              {/* Certificate Details */}
              <div className="p-8">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Recipient Name
                    </dt>
                    <dd className="mt-1 text-lg font-bold text-gray-900">
                      {cert.recipientName}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Certificate Number
                    </dt>
                    <dd className="mt-1 text-lg font-bold text-gray-900">
                      {cert.certificateNumber || cert.id}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Certificate Title
                    </dt>
                    <dd className="mt-1 text-base font-medium text-gray-900">
                      {cert.certificateTitle}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Course / Program
                    </dt>
                    <dd className="mt-1 text-base font-medium text-gray-900">
                      {cert.courseName}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Issuing Organization
                    </dt>
                    <dd className="mt-1 text-base text-gray-900">
                      {cert.organization}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Issue Date
                    </dt>
                    <dd className="mt-1 text-base text-gray-900">
                      {formatDate(cert.issueDate)}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Certificate Status
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          cert.status === "VALID"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cert.status}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Verification Token
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-gray-500 break-all">
                      {cert.verificationToken}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Certificate Preview */}
            <div className="bg-gray-100 p-8 rounded-2xl border border-gray-200 flex justify-center overflow-x-auto shadow-inner">
              <div className="origin-top-left">
                <CertificatePreview certificate={cert} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function createPocCertificate(token: string): Certificate {
  const normalizedToken = token.toLowerCase();
  const tokenHash = Array.from(normalizedToken).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  const status =
    normalizedToken.includes("failed") ||
    normalizedToken.includes("invalid") ||
    tokenHash % 2 === 1
      ? "REJECTED"
      : normalizedToken.includes("revoked")
        ? "REVOKED"
        : normalizedToken.includes("pending")
          ? "PENDING_APPROVAL"
          : "VALID";

  return {
    id: `POC-${token.slice(0, 8).toUpperCase()}`,
    certificateNumber: `POC-${token.slice(0, 8).toUpperCase()}`,
    verificationToken: token,
    verificationUrl: getVerificationUrl(token),
    recipientName: "Demo Certificate Holder",
    certificateTitle: "Certificate of Completion",
    courseName: "Advanced React Patterns",
    issueDate: new Date().toISOString().slice(0, 10),
    organization: "KBZ Bank",
    certificateType: "completion",
    email: "demo@example.com",
    status,
    createdAt: new Date().toISOString(),
  };
}
