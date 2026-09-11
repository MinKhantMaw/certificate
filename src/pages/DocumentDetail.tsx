import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { storage } from "../services/storage";
import { Document, DocumentTemplate } from "../types";
import { DocumentPreview } from "../components/DocumentPreview";
import { useEncryptedQr } from "../hooks/useEncryptedQr";
import { getTemplateKeys, getVerificationUrl, resolveTemplateValue } from "../utils";
import {
  ArrowLeft,
  Download,
  ShieldAlert,
  ExternalLink,
  Printer,
  RefreshCw,
} from "lucide-react";

// Printing before the QR resolves would produce a document with an empty QR box.
function PrintDocumentButton({
  document,
  requiresQr,
}: {
  document: Document;
  requiresQr: boolean;
}) {
  const { status, retry } = useEncryptedQr(document, requiresQr);

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

type DetailField = { key: string; label: string };

export function humanizeDetailKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getDetailFields(template?: DocumentTemplate): DetailField[] {
  return getTemplateKeys(template?.layout).map((key) => ({
    key,
    label: humanizeDetailKey(key),
  }));
}

export function getDetailData(document: Document): Record<string, string | number> {
  return {
    ...document.dynamicData,
    name: document.dynamicData?.name || document.recipientName,
    recipient_name: document.dynamicData?.recipient_name || document.recipientName,
    email: document.dynamicData?.email || document.email,
    course: document.dynamicData?.course || document.courseName,
    course_name: document.dynamicData?.course_name || document.courseName,
    issue_date: document.dynamicData?.issue_date || document.issueDate,
    organization: document.dynamicData?.organization || document.organization,
    document_title: document.dynamicData?.document_title || document.documentTitle,
    document_type: document.dynamicData?.document_type || document.documentType,
  };
}

export function getDetailValue(document: Document, key: string): string {
  return resolveTemplateValue(
    { id: key, type: "text", key, x: 0, y: 0, width: 0, height: 0, rotation: 0 },
    getDetailData(document),
  );
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<Document | null>(null);
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  useEffect(() => {
    if (id) {
      const document = storage.getDocumentById(id) || null;
      setCert(document);
      if (document?.documentTemplateId) {
        setTemplateLoading(true);
        storage.initTemplates().then((templates) => {
          setTemplate(templates.find((item) => item.id === document.documentTemplateId) || null);
        }).finally(() => setTemplateLoading(false));
      } else {
        setTemplate(null);
      }
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
  const detailFields = getDetailFields(template || undefined);
  const requiresQr = Boolean(
    template?.layout?.elements.some((element) => element.type === "qr"),
  );

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
          <PrintDocumentButton document={cert} requiresQr={requiresQr} />
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
      <div className="print:hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">
            Document Information
          </h3>
          {templateLoading ? (
            <p className="text-sm text-gray-500">Loading template fields...</p>
          ) : !template ? (
            <p className="text-sm text-gray-500">Template fields are unavailable.</p>
          ) : !detailFields.length ? (
            <p className="text-sm text-gray-500">This template has no information fields.</p>
          ) : (
            <div className="space-y-3">
              {detailFields.map((field) => (
                <div key={field.key} className="flex justify-between gap-6">
                  <span className="text-gray-500">{field.label}</span>
                  <span className="text-right font-medium">{getDetailValue(cert, field.key) || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Print Area */}
      <div className="bg-gray-100 p-8 rounded-xl border border-gray-200 flex justify-center overflow-x-auto print:bg-white print:p-0 print:border-none print:m-0 print:block">
        <div className="print-container origin-top-left">
          <DocumentPreview
            document={cert}
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
