import { useEffect, useState, type CSSProperties } from "react";
import { QRCodeSVG } from "qrcode.react";
import { storage } from "../services/storage";
import { useEncryptedQr } from "../hooks/useEncryptedQr";
import { Certificate, TemplateElement, TemplateLayout } from "../types";
import { formatDate, resolveTemplateValue } from "../utils";

function CertificateQrCode({ certificate }: { certificate: Certificate }) {
  const { url, status } = useEncryptedQr(certificate);
  if (status === "ready")
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title="Scan or click to verify this certificate"
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

export function CertificatePreview({
  certificate,
  baseUrl,
  showQr = true,
}: {
  certificate: Certificate;
  baseUrl?: string;
  showQr?: boolean;
}) {
  const hasTemplate = Boolean(certificate.certificateTemplateId);
  const [loadingTemplate, setLoadingTemplate] = useState(
    hasTemplate && !storage.getTemplates().length,
  );
  const [templateError, setTemplateError] = useState("");
  const [template, setTemplate] = useState(() =>
    certificate.certificateTemplateId
      ? storage
          .getTemplates()
          .find((item) => item.id === certificate.certificateTemplateId)
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
        const nextTemplate = certificate.certificateTemplateId
          ? templates.find(
              (item) => item.id === certificate.certificateTemplateId,
            )
          : undefined;
        setTemplate(nextTemplate);
        setLoadingTemplate(false);
        setTemplateError(
          certificate.certificateTemplateId && !nextTemplate
            ? "Certificate template could not be loaded."
            : "",
        );
      })
      .catch(() => {
        if (!active) return;
        setLoadingTemplate(false);
        if (certificate.certificateTemplateId)
          setTemplateError("Certificate template could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [certificate.certificateTemplateId]);

  if (loadingTemplate)
    return <PreviewError message="Loading certificate template..." />;
  if (templateError) return <PreviewError message={templateError} />;

  if (template?.layout) {
    return (
      <DynamicCertificatePreview
        certificate={certificate}
        layout={template.layout}
        showQr={showQr}
      />
    );
  }

  return (
    <div
      className="relative mx-auto aspect-[1.414/1] min-w-[800px] w-full max-w-[1123px] overflow-hidden bg-white font-sans text-[#333] shadow-lg"
      id="printable-certificate"
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
            {certificate.organization || "KBZ BANK"}
          </div>
          <div className="mt-1 text-[clamp(5px,.65vw,8px)] font-bold tracking-[.35em] text-[#19427e]">
            STRENGTH OF MYANMAR
          </div>
          <div className="mt-1 text-[clamp(5px,.65vw,8px)] uppercase tracking-[.2em] text-slate-500">
            {template?.name || "Certificate Template"}
          </div>
        </div>
        <h1 className="mt-[1.5%] whitespace-nowrap text-[clamp(12px,1.8vw,21px)] font-bold">
          F21- Software &amp; Data Analytics Function
        </h1>
        <h2 className="mt-[3%] whitespace-nowrap text-[clamp(20px,3vw,34px)] font-bold text-[#293d80]">
          {certificate.certificateTitle || "CERTIFICATE OF COMPLETION"}
        </h2>
        <p className="mt-[1.5%] text-[clamp(8px,1.1vw,13px)]">
          This Certificate is Proudly Presented to
        </p>
        <p className="mt-[4%] text-[clamp(10px,1.5vw,17px)] font-medium">
          {certificate.recipientName}
        </p>
        <p className="mt-[1.2%] text-[clamp(8px,1.1vw,13px)]">
          Employee ID -{" "}
          <span className="font-medium">
            {certificate.certificateNumber || certificate.id}
          </span>
        </p>
        <p className="mt-[2.2%] max-w-[85%] text-[clamp(8px,1.1vw,13px)]">
          For successfully completing the{" "}
          <strong>{certificate.courseName}</strong>{" "}
          <span>({certificate.certificateType})</span>.
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
              {formatDate(certificate.issueDate)}
            </span>
          </div>
          <div className="absolute bottom-0 left-1/2 flex shrink-0 -translate-x-1/2 flex-col items-center gap-1">
            {showQr && (
              <div className="flex flex-col items-center gap-1 border border-[#d9d9d9] bg-white p-1">
                <div className="h-15 w-15">
                  <CertificateQrCode certificate={certificate} />
                </div>
                <span className="text-[clamp(6px,.75vw,9px)] text-[#555]">
                  Scan to Verify
                </span>
              </div>
            )}
            <span className="font-mono text-[clamp(6px,.75vw,9px)] tracking-wider text-[#555]">
              ID: {certificate.shortId || certificate.certificateNumber}
            </span>
          </div>
          <div className="text-right">
            {certificate.signatureImage && (
              <img
                src={certificate.signatureImage}
                alt={`Signature of ${certificate.signerName || "certificate approver"}`}
                className="mb-1 ml-auto h-10 max-w-32 object-contain object-right"
              />
            )}
            <strong className="block">
              {certificate.signerName || "Awaiting approval"}
            </strong>
            {certificate.signerTitle && <span>{certificate.signerTitle}</span>}
          </div>
        </div>
      </div>

      {certificate.status === "REVOKED" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
          <div className="border-8 border-red-500 text-red-500 text-8xl font-bold uppercase opacity-30 transform -rotate-45 px-8 py-2">
            REVOKED
          </div>
        </div>
      )}
    </div>
  );
}

function DynamicCertificatePreview({
  certificate,
  layout,
  showQr,
}: {
  certificate: Certificate;
  layout: TemplateLayout;
  showQr: boolean;
}) {
  const [backgroundError, setBackgroundError] = useState(false);
  const data: Record<string, unknown> = {
    ...certificate.dynamicData,
    name: certificate.dynamicData?.name || certificate.recipientName,
    recipient_name: certificate.recipientName,
    course: certificate.dynamicData?.course || certificate.courseName,
    course_name: certificate.courseName,
    short_id: certificate.shortId || certificate.certificateNumber,
    certificate_number: certificate.certificateNumber,
    certificate_id:
      certificate.dynamicData?.certificate_id ||
      certificate.shortId ||
      certificate.certificateNumber,
    issue_date: certificate.dynamicData?.issue_date || certificate.issueDate,
    department: certificate.dynamicData?.department || "",
  };
  const signatures = storage.getUsers();
  const aspectRatio = `${layout.canvas.width} / ${layout.canvas.height}`;
  const elements = layout.elements || [];
  const hasQrElement = elements.some((element) => element.type === "qr");
  const hasIdElement = elements.some(
    (element) =>
      element.type === "text" &&
      ["certificate_id", "short_id", "certificate_number"].includes(
        (element.key || "").replace(/^\{\{|\}\}$/g, "").trim().toLowerCase(),
      ),
  );
  const certificateId = certificate.shortId || certificate.certificateNumber;
  if (
    layout.version !== 1 ||
    layout.canvas.width <= 0 ||
    layout.canvas.height <= 0 ||
    !Array.isArray(layout.elements)
  ) {
    return <PreviewError message="Invalid certificate template layout." />;
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
      id="printable-certificate"
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
        <PreviewError message="Certificate background could not be loaded." />
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
          return showQr ? (
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
              <CertificateQrCode certificate={certificate} />
            </div>
          ) : null;
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
                ? "Certificate signature"
                : "Certificate artwork"
            }
            style={{ ...style, objectFit: "contain" }}
          />
        ) : null;
      })}
      {(!hasIdElement || (showQr && !hasQrElement)) && (
        <div className="absolute bottom-[3%] left-1/2 flex w-[14%] -translate-x-1/2 flex-col items-center gap-[3%]">
          {showQr && !hasQrElement && (
            <div className="flex w-full flex-col items-center gap-[4%] bg-white p-[4%]">
              <div className="aspect-square w-[76%]">
                <CertificateQrCode certificate={certificate} />
              </div>
              <span className="text-[clamp(5px,.6vw,8px)] leading-none text-[#555]">
                Scan to Verify
              </span>
            </div>
          )}
          {!hasIdElement && (
            <span className="font-mono text-[clamp(5px,.6vw,8px)] leading-none tracking-wider text-[#555]">
              ID: {certificateId}
            </span>
          )}
        </div>
      )}
      {certificate.status === "REVOKED" && (
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
