import { QRCodeSVG } from 'qrcode.react';
import { Certificate } from '../types';
import { formatDate } from '../utils';

export function CertificatePreview({ certificate, baseUrl }: { certificate: Certificate; baseUrl?: string }) {
  const origin = baseUrl || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000');
  const verificationUrl = certificate.verificationUrl || `${origin}/verify/${certificate.verificationToken}`;

  // Log as requested for token debugging
  console.log("QR verification URL:", verificationUrl);
  console.log("Token stored in certificate:", certificate.verificationToken);

  return (
    <div className="w-full max-w-[800px] aspect-[1.414/1] bg-white border-[12px] border-double border-gray-300 p-12 relative shadow-lg mx-auto flex flex-col justify-between" id="printable-certificate">
      
      {/* Background decoration */}
      <div className="absolute inset-0 m-4 border border-gray-200 opacity-50 pointer-events-none"></div>

      {/* Header */}
      <div className="text-center space-y-4 relative z-10">
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-300 mb-6">
          <span className="text-2xl font-serif text-gray-400">Logo</span>
        </div>
        <h1 className="text-4xl font-serif font-bold text-gray-900 uppercase tracking-widest">
          {certificate.organization}
        </h1>
        <h2 className="text-2xl font-serif text-blue-800 tracking-wider">
          {certificate.certificateTitle}
        </h2>
      </div>

      {/* Body */}
      <div className="text-center space-y-6 my-8 relative z-10">
        <p className="text-gray-500 uppercase tracking-widest text-sm">
          This certificate is proudly presented to
        </p>
        <p className="text-5xl font-serif italic text-gray-900 border-b border-gray-300 inline-block px-12 pb-2">
          {certificate.recipientName}
        </p>
        <p className="text-gray-600 max-w-lg mx-auto">
          for successfully completing the <strong>{certificate.certificateType}</strong> requirements in
        </p>
        <p className="text-2xl font-medium text-gray-800">
          {certificate.courseName}
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end relative z-10 mt-8">
        <div className="text-center w-48">
          <div className="border-b border-gray-400 pb-1 mb-2">
            <span className="text-gray-800 italic font-serif text-xl signature-font">Authorized Signature</span>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Authorized Signature</p>
        </div>

        <div className="flex flex-col items-center">
          <a 
            href={verificationUrl} 
            target="_blank" 
            rel="noreferrer" 
            title={`Scan or click to verify: ${verificationUrl}`}
            className="bg-white p-2 border border-gray-200 mb-1 inline-block hover:border-blue-500 hover:shadow transition-all group"
          >
            <QRCodeSVG value={verificationUrl} size={84} level="M" />
          </a>
          <span className="text-[10px] text-gray-400 font-medium">Scan to Verify</span>
        </div>

        <div className="text-center w-48">
          <div className="border-b border-gray-400 pb-1 mb-2">
            <span className="text-gray-800 font-medium">{formatDate(certificate.issueDate)}</span>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Date of Issue</p>
          <p className="text-[10px] text-gray-400 mt-4">ID: {certificate.certificateNumber || certificate.id}</p>
        </div>
      </div>
      
      {/* Watermark Status */}
      {certificate.status === 'REVOKED' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
          <div className="border-8 border-red-500 text-red-500 text-8xl font-bold uppercase opacity-30 transform -rotate-45 px-8 py-2">
            REVOKED
          </div>
        </div>
      )}
    </div>
  );
}
