import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { storage } from "../services/storage";
import { Certificate } from "../types";
import { CertificatePreview } from "../components/CertificatePreview";
import {
  ArrowLeft,
  Download,
  ShieldAlert,
  ExternalLink,
  Printer,
} from "lucide-react";

export function CertificateDetail() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    if (id) {
      setCert(storage.getCertificateById(id) || null);
    }
  }, [id]);

  const handleRevoke = () => {
    if (cert && confirm("Are you sure you want to revoke this certificate?")) {
      storage.updateCertificateStatus(cert.id, "REVOKED");
      setCert({ ...cert, status: "REVOKED" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!cert) {
    return (
      <div className="p-8 text-center text-gray-500">
        Certificate not found.
        <br />
        <Link
          to="/certificates"
          className="text-blue-600 mt-4 inline-block hover:underline"
        >
          Back to List
        </Link>
      </div>
    );
  }

  const verifyUrl =
    cert.verificationUrl ||
    `${window.location.origin}/verify/${cert.verificationToken}`;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden">
        <Link
          to="/certificates"
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
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Printer className="w-4 h-4 mr-2" />
            Download PDF
          </button>
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
              <span className="text-gray-500">Certificate ID</span>
              <span className="font-medium">{cert.id}</span>
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
        <div className="print-container transform origin-top-left md:scale-100 sm:scale-75 scale-50 print:scale-100">
          <CertificatePreview
            certificate={cert}
            baseUrl={window.location.origin}
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
