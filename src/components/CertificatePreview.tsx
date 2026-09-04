import { QRCodeSVG } from "qrcode.react";
import { Certificate } from "../types";
import { formatDate, getVerificationUrl } from "../utils";

export function CertificatePreview({
  certificate,
  baseUrl,
}: {
  certificate: Certificate;
  baseUrl?: string;
}) {
  const verificationUrl =
    certificate.verificationUrl ||
    getVerificationUrl(certificate.verificationToken);

  return (
    <div
      className="relative mx-auto aspect-[1.414/1] min-w-[800px] w-full max-w-[1123px] overflow-hidden bg-white font-sans text-[#333] shadow-lg"
      id="printable-certificate"
    >
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
          <a
            href={verificationUrl}
            target="_blank"
            rel="noreferrer"
            title="Scan or click to verify this certificate"
            className="absolute bottom-0 left-1/2 flex shrink-0 -translate-x-1/2 flex-col items-center gap-1 border border-[#d9d9d9] bg-white p-1"
          >
            <QRCodeSVG value={verificationUrl} size={60} level="M" />
            <span className="text-[clamp(6px,.75vw,9px)] text-[#555]">
              Scan to Verify
            </span>
          </a>
          <div className="text-right">
            <div className="mb-1 text-[clamp(15px,2vw,22px)] italic text-[#3158bd]">
              MMA
            </div>
            <strong className="block">Moet Moet Ei Aung</strong>
            <span>
              Head of Software and Data Analytics Function
              <br />
              KBZ Bank
            </span>
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
