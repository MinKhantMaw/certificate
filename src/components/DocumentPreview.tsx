import { useEffect, useState, type CSSProperties } from "react";
import { QRCodeSVG } from "qrcode.react";
import { storage } from "../services/storage";
import { useEncryptedQr } from "../hooks/useEncryptedQr";
import { Document, TemplateElement, TemplateLayout } from "../types";
import { formatDate, resolveTemplateValue } from "../utils";

function DocumentQrCode({ document }: { document: Document }) {
  const { url, status } = useEncryptedQr(document);
  if (status === "ready")
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title="Scan or click to verify this document"
        className="block h-full w-full"
      >
        <QRCodeSVG value={url} width="100%" height="100%" level="M" />
      </a>
    );
  return (
    <div className="flex h-full w-full items-center justify-center border border-dashed border-[#c9c9c9] bg-white p-1 text-center text-[clamp(5px,.6vw,8px)] uppercase leading-tight tracking-wide text-[#999]">
      {status === "error" ? "QR unavailable" : status === "idle" ? "QR" : ""}
    </div>
  );
}

export function DocumentPreview({
  document,
  baseUrl,
}: {
  document: Document;
  baseUrl?: string;
}) {
  const hasTemplate = Boolean(document.documentTemplateId);
  const [loadingTemplate, setLoadingTemplate] = useState(
    hasTemplate && !storage.getTemplates().length,
  );
  const [templateError, setTemplateError] = useState("");
  const [template, setTemplate] = useState(() =>
    document.documentTemplateId
      ? storage
          .getTemplates()
          .find((item) => item.id === document.documentTemplateId)
      : undefined,
  );
  useEffect(() => {
    let active = true;
    setLoadingTemplate(hasTemplate);
    setTemplateError("");
    storage
      .initTemplates()
      .then((templates) => {
        if (!active) return;
        const nextTemplate = document.documentTemplateId
          ? templates.find(
              (item) => item.id === document.documentTemplateId,
            )
          : undefined;
        setTemplate(nextTemplate);
        setLoadingTemplate(false);
        setTemplateError(
          document.documentTemplateId && !nextTemplate
            ? "Document template could not be loaded."
            : "",
        );
      })
      .catch(() => {
        if (!active) return;
        setLoadingTemplate(false);
        if (document.documentTemplateId)
          setTemplateError("Document template could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [document.documentTemplateId]);

  if (loadingTemplate)
    return <PreviewError message="Loading document template..." />;
  if (templateError) return <PreviewError message={templateError} />;

  if (template?.layout) {
    return (
      <DynamicDocumentPreview
        document={document}
        layout={template.layout}
      />
    );
  }

  return (
    <div
      className="relative mx-auto aspect-[1.414/1] min-w-[800px] w-full max-w-[1123px] overflow-hidden bg-white font-sans text-[#333] shadow-lg"
      id="printable-document"
    >
      {template?.previewImage && (
        <img
          src={template.previewImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15"
        />
      )}
      <div className="absolute left-0 top-0 h-[33%] w-[21%] overflow-hidden">
        <div className="absolute -left-[8%] -top-[10%] h-[48%] w-[54%] rotate-45 bg-[#ed1c2b]" />
        <div className="absolute -left-[14%] top-[10%] h-[42%] w-[48%] rotate-45 bg-[#a71920]" />
        <div className="absolute left-[17%] -top-[11%] h-[55%] w-[42%] rotate-45 bg-[#ed1c2b]" />
        <div className="absolute left-[20%] top-[13%] h-[45%] w-[43%] rotate-45 bg-[#a71920]" />
        <div className="absolute left-[42%] -top-[16%] h-[64%] w-[40%] rotate-45 bg-[#ed1c2b]" />
        <div className="absolute left-[53%] top-[8%] h-[38%] w-[37%] rotate-45 bg-[#fff]" />
      </div>
      <div className="absolute right-0 top-0 h-[33%] w-[21%] overflow-hidden">
        <div className="absolute -right-[8%] -top-[10%] h-[48%] w-[54%] -rotate-45 bg-[#174d9b]" />
        <div className="absolute -right-[14%] top-[10%] h-[42%] w-[48%] -rotate-45 bg-[#203675]" />
        <div className="absolute right-[17%] -top-[11%] h-[55%] w-[42%] -rotate-45 bg-[#174d9b]" />
        <div className="absolute right-[20%] top-[13%] h-[45%] w-[43%] -rotate-45 bg-[#203675]" />
        <div className="absolute right-[42%] -top-[16%] h-[64%] w-[40%] -rotate-45 bg-[#174d9b]" />
        <div className="absolute right-[53%] top-[8%] h-[38%] w-[37%] -rotate-45 bg-white" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center px-[6%] pt-[4%] text-center">
        <div className="flex flex-col items-center">
          <div className="relative h-12 w-14 text-[#b3202b]">
            <span className="absolute left-1/2 top-0 -translate-x-1/2 border-x-[14px] border-b-[25px] border-x-transparent border-b-[#c3202f]" />
            <span className="absolute left-1/2 top-3 -translate-x-1/2 border-x-[14px] border-b-[25px] border-x-transparent border-b-[#173b78]" />
          </div>
          <div className="-mt-1 text-[clamp(14px,2.3vw,25px)] font-bold leading-none text-[#b3202b]">
            {document.organization || "KBZ BANK"}
          </div>
          <div className="mt-1 text-[clamp(5px,.65vw,8px)] font-bold tracking-[.35em] text-[#19427e]">
            STRENGTH OF MYANMAR
          </div>
          <div className="mt-1 text-[clamp(5px,.65vw,8px)] uppercase tracking-[.2em] text-slate-500">
            {template?.name || "Document Template"}
          </div>
        </div>
        <h1 className="mt-[1.5%] whitespace-nowrap text-[clamp(12px,1.8vw,21px)] font-bold">
          F21- Software &amp; Data Analytics Function
        </h1>
        <h2 className="mt-[3%] whitespace-nowrap text-[clamp(20px,3vw,34px)] font-bold text-[#293d80]">
          {document.documentTitle || "DOCUMENT OF COMPLETION"}
        </h2>
        <p className="mt-[1.5%] text-[clamp(8px,1.1vw,13px)]">
          This Document is Proudly Presented to
        </p>
        <p className="mt-[4%] text-[clamp(10px,1.5vw,17px)] font-medium">
          {document.recipientName}
        </p>
        <p className="mt-[1.2%] text-[clamp(8px,1.1vw,13px)]">
          Employee ID -{" "}
          <span className="font-medium">
            {document.documentNumber || document.id}
          </span>
        </p>
        <p className="mt-[2.2%] max-w-[85%] text-[clamp(8px,1.1vw,13px)]">
          For successfully completing the{" "}
          <strong>{document.courseName}</strong>{" "}
          <span>({document.documentType})</span>.
        </p>
        <h3 className="mt-[2%] text-[clamp(10px,1.4vw,16px)] font-bold">
          BUSINESS REQUIREMENT CAPABILITIES
        </h3>
        {/* <div className="mt-[.6%] grid w-[58%] grid-cols-2 gap-x-[8%] text-left text-[clamp(7px,1vw,12px)] leading-[1.65]">
          <div>
            01. Understanding Business Problems
            <br />
            02. Defining Business Objectives
            <br />
            03. Creating a BRD Draft
          </div>
          <div>
            0. Reviewing Requirements
            <br />
            04. Collaborating with IT
          </div>
        </div> */}
        <div className="absolute bottom-[1.5%] left-[6%] right-[6%] flex items-end justify-between leading-tight text-[clamp(7px,1.1vw,13px)]">
          <div>
            Workshop Date :{" "}
            <span className="font-medium">
              {formatDate(document.issueDate)}
            </span>
          </div>
          <div className="absolute bottom-0 left-1/2 flex shrink-0 -translate-x-1/2 flex-col items-center gap-1">
            <span className="font-mono text-[clamp(6px,.75vw,9px)] tracking-wider text-[#555]">
              ID: {document.shortId || document.documentNumber}
            </span>
          </div>
          <div className="text-right">
            {document.signatureImage && (
              <img
                src={document.signatureImage}
                alt={`Signature of ${document.signerName || "document approver"}`}
                className="mb-1 ml-auto h-10 max-w-32 object-contain object-right"
              />
            )}
            <strong className="block">
              {document.signerName || "Awaiting approval"}
            </strong>
            {document.signerTitle && <span>{document.signerTitle}</span>}
          </div>
        </div>
      </div>

      {document.status === "REVOKED" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
          <div className="border-8 border-red-500 text-red-500 text-8xl font-bold uppercase opacity-30 transform -rotate-45 px-8 py-2">
            REVOKED
          </div>
        </div>
      )}
    </div>
  );
}

function DynamicDocumentPreview({
  document,
  layout,
}: {
  document: Document;
  layout: TemplateLayout;
}) {
  const [backgroundError, setBackgroundError] = useState(false);
  const data: Record<string, unknown> = {
    ...document.dynamicData,
    name: document.dynamicData?.name || document.recipientName,
    recipient_name: document.recipientName,
    course: document.dynamicData?.course || document.courseName,
    course_name: document.courseName,
    short_id: document.shortId || document.documentNumber,
    document_number: document.documentNumber,
    document_id:
      document.dynamicData?.document_id ||
      document.shortId ||
      document.documentNumber,
    issue_date: document.dynamicData?.issue_date || document.issueDate,
    department: document.dynamicData?.department || "",
  };
  const signatures = storage.getUsers();
  const aspectRatio = `${layout.canvas.width} / ${layout.canvas.height}`;
  const elements = layout.elements || [];
  const hasIdElement = elements.some(
    (element) =>
      element.type === "text" &&
      ["document_id", "short_id", "document_number"].includes(
        (element.key || "")
          .replace(/^\{\{|\}\}$/g, "")
          .trim()
          .toLowerCase(),
      ),
  );
  const documentId = document.shortId || document.documentNumber;
  if (
    layout.version !== 1 ||
    layout.canvas.width <= 0 ||
    layout.canvas.height <= 0 ||
    !Array.isArray(layout.elements)
  ) {
    return <PreviewError message="Invalid document template layout." />;
  }
  const styleFor = (element: TemplateElement): CSSProperties => ({
    position: "absolute",
    left: `${(element.x / layout.canvas.width) * 100}%`,
    top: `${(element.y / layout.canvas.height) * 100}%`,
    width: `${(element.width / layout.canvas.width) * 100}%`,
    height: `${(element.height / layout.canvas.height) * 100}%`,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: "center",
  });
  return (
    <div
      id="printable-document"
      className="relative mx-auto min-w-[800px] w-full max-w-[1123px] overflow-hidden bg-white shadow-lg"
      style={{ aspectRatio }}
    >
      {layout.background && (
        <img
          src={layout.background}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBackgroundError(true)}
        />
      )}
      {backgroundError && (
        <PreviewError message="Document background could not be loaded." />
      )}
      {layout.elements.map((element) => {
        const style = styleFor(element);
        if (element.type === "text")
          return (
            <div
              key={element.id}
              style={{
                ...style,
                color: element.style?.color,
                fontFamily: element.style?.fontFamily,
                fontSize: `${(element.style?.fontSize || 16) * (layout.canvas.width / 1123)}px`,
                fontWeight: element.style?.fontWeight,
                lineHeight: element.style?.lineHeight || 1.2,
                textAlign: element.style?.align,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  element.style?.align === "center"
                    ? "center"
                    : element.style?.align === "right"
                      ? "flex-end"
                      : "flex-start",
                whiteSpace: "pre-wrap",
                overflow: "hidden",
                padding: 8,
              }}
            >
              {resolveTemplateValue(element, data)}
            </div>
          );
        if (element.type === "shape")
          return (
            <div
              key={element.id}
              style={{
                ...style,
                background: element.fill,
                border: `1px solid ${element.stroke || "transparent"}`,
              }}
            />
          );
        if (element.type === "qr")
          return (
            <div
              key={element.id}
              style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "white",
              }}
            >
              <DocumentQrCode document={document} />
            </div>
          );
        const source =
          element.type === "signature"
            ? signatures.find((user) => user.id === element.signatureId)
                ?.signatureImage
            : element.src;
        return source ? (
          <img
            key={element.id}
            src={source}
            alt={
              element.type === "signature"
                ? "Document signature"
                : "Document artwork"
            }
            style={{ ...style, objectFit: "contain" }}
          />
        ) : null;
      })}
      {!hasIdElement && (
        <div className="absolute bottom-[3%] left-1/2 flex w-[14%] -translate-x-1/2 flex-col items-center gap-[3%]">
          {!hasIdElement && (
            <span className="font-mono text-[clamp(5px,.6vw,8px)] leading-none tracking-wider text-[#555]">
              ID: {documentId}
            </span>
          )}
        </div>
      )}
      {document.status === "REVOKED" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
          <div className="-rotate-45 border-8 border-red-500 px-8 py-2 text-8xl font-bold uppercase text-red-500 opacity-30">
            REVOKED
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewError({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[560px] w-full max-w-[1123px] items-center justify-center bg-white p-8 text-center text-sm text-red-700 shadow-lg">
      {message}
    </div>
  );
}
