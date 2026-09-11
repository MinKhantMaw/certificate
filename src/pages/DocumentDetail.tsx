import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import { storage } from "../services/storage";
import { Document, DocumentTemplate } from "../types";
import { DocumentPreview } from "../components/DocumentPreview";
import { ConfirmModal } from "../components/ConfirmModal";
import { useEncryptedQr } from "../hooks/useEncryptedQr";
import { getTemplateKeys, getVerificationUrl, resolveTemplateValue } from "../utils";
import {
  ArrowLeft,
  Download,
  ShieldAlert,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

function PrintDocumentButton({
  document,
  requiresQr,
}: {
  document: Document;
  requiresQr: boolean;
}) {
  const { status, retry } = useEncryptedQr(document, requiresQr);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

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
  const downloadImage = async () => {
    const node = window.document.getElementById("printable-document");
    if (!node) return setDownloadError("The document preview is not ready.");
    setDownloading(true);
    setDownloadError("");
    try {
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      const link = window.document.createElement("a");
      link.download = `${document.documentNumber || document.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setDownloadError("Unable to download the document image.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={downloadImage}
        disabled={!ready || downloading}
        title={ready ? undefined : "Waiting for the verification QR code"}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        <Download className="w-4 h-4 mr-2" />
        {downloading ? "Preparing image..." : ready ? "Download Image" : "Preparing QR..."}
      </button>
      {downloadError && <span role="alert" className="text-xs text-red-600">{downloadError}</span>}
    </div>
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
  const navigate = useNavigate();
  const [cert, setCert] = useState<Document | null>(null);
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionError, setActionError] = useState("");
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
    setShowRevokeModal(true);
  };

  const confirmRevoke = () => {
    if (!cert) return;
    try {
      storage.updateDocumentStatus(cert.id, "REVOKED");
      setCert({ ...cert, status: "REVOKED" });
      setShowRevokeModal(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to revoke the document.");
    }
  };

  const confirmDelete = () => {
    if (!cert) return;
    try {
      storage.deleteDocument(cert.id);
      navigate("/documents");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete the document.");
      setShowDeleteModal(false);
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
      {showRevokeModal && (
        <ConfirmModal
          title="Revoke document?"
          message="This action cannot be undone. The document will no longer be valid."
          confirmLabel="Revoke document"
          onConfirm={confirmRevoke}
          onCancel={() => setShowRevokeModal(false)}
        />
      )}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete document?"
          message="This action cannot be undone. The document and its approval records will be removed."
          confirmLabel="Delete document"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
      {actionError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">{actionError}</p>}
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
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium bg-white"
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
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium bg-white"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
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
