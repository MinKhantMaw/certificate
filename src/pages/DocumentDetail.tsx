import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { storage } from "../services/storage";
import { Document } from "../types";
import { DocumentPreview } from "../components/DocumentPreview";
import { useEncryptedQr } from "../hooks/useEncryptedQr";
import { getVerificationUrl } from "../utils";
import {
  ArrowLeft,
  Download,
  ShieldAlert,
  ExternalLink,
  Printer,
  RefreshCw,
  QrCode,
  EyeOff,
} from "lucide-react";

// Printing before the QR resolves would produce a document with an empty QR box.
function PrintDocumentButton({
  document,
  requiresQr,
}: {
  document: Document;
  requiresQr: boolean;
}) {
  const { status, retry } = useEncryptedQr(document);

  if (requiresQr && status === "error")
    return (
      <button
        onClick={retry}
        className="flex items-center px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 font-medium bg-white"
        title="The verification QR code could not be generated. Click to try again."
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry QR
      </button>
    );

  const ready = !requiresQr || status === "ready";

  return (
    <button
      onClick={() => window.print()}
      disabled={!ready}
      title={ready ? undefined : "Waiting for the verification QR code"}
      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:cursor-not-allowed disabled:bg-blue-300"
    >
      <Printer className="w-4 h-4 mr-2" />
      {ready ? "Download PDF" : "Preparing QR..."}
    </button>
  );
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<Document | null>(null);
  const [showQr, setShowQr] = useState(true);

  useEffect(() => {
    if (id) {
      setCert(storage.getDocumentById(id) || null);
    }
  }, [id]);

  const handleRevoke = () => {
    if (cert && confirm("Are you sure you want to revoke this document?")) {
      storage.updateDocumentStatus(cert.id, "REVOKED");
      setCert({ ...cert, status: "REVOKED" });
    }
  };

  if (!cert) {
    return (
      <div className="p-8 text-center text-gray-500">
        Document not found.
        <br />
        <Link
          to="/documents"
          className="text-blue-600 mt-4 inline-block hover:underline"
        >
          Back to List
        </Link>
      </div>
    );
  }

  const verifyUrl = getVerificationUrl(cert.verificationToken);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden">
        <Link
          to="/documents"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Link>
        <div className="flex space-x-3">
          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium bg-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Verification Page
          </a>
          <button
            onClick={() => setShowQr((value) => !value)}
            aria-pressed={showQr}
            className={`flex items-center px-4 py-2 border rounded-lg font-medium ${showQr ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
            title={
              showQr
                ? "Hide the verification QR code on this document"
                : "Show the verification QR code on this document"
            }
          >
            {showQr ? (
              <QrCode className="w-4 h-4 mr-2" />
            ) : (
              <EyeOff className="w-4 h-4 mr-2" />
            )}
            {showQr ? "QR On" : "QR Off"}
          </button>
          <PrintDocumentButton document={cert} requiresQr={showQr} />
          {cert.status === "VALID" && (
            <button
              onClick={handleRevoke}
              className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium bg-white"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Revoke
            </button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">
            Recipient Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{cert.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{cert.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Course</span>
              <span className="font-medium">{cert.courseName}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">
            System Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span
                className={`font-medium ${cert.status === "VALID" ? "text-green-600" : "text-red-600"}`}
              >
                {cert.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Document ID</span>
              <span className="font-mono font-medium tracking-wider">
                {cert.shortId || cert.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Document Number</span>
              <span className="font-medium">{cert.documentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Token</span>
              <span className="font-mono text-xs text-gray-600 break-all max-w-[200px] text-right">
                {cert.verificationToken}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Area */}
      <div className="bg-gray-100 p-8 rounded-xl border border-gray-200 flex justify-center overflow-x-auto print:bg-white print:p-0 print:border-none print:m-0 print:block">
        <div className="print-container origin-top-left">
          <DocumentPreview
            document={cert}
            baseUrl={window.location.origin}
            showQr={showQr}
          />
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
