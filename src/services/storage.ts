import { Certificate, ImportRecord, User } from '../types';

const CERT_KEY = 'certificates';
const LEGACY_CERT_KEY = 'cms_certificates';
const IMPORT_KEY = 'cms_imports';
const AUTH_KEY = 'cms_auth';

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

export const storage = {
  // Auth
  login: (email: string): User => {
    const user = { email, name: 'Admin User' };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },
  getUser: (): User | null => {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Certificates
  getCertificates: (): Certificate[] => {
    storage.initDemoData();

    let raw = localStorage.getItem(CERT_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_CERT_KEY);
    }
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      const baseUrl = getBaseUrl();
      let modified = false;

      // Ensure every certificate has matching certificateNumber, verificationToken, and verificationUrl
      const normalized: Certificate[] = parsed.map((c: any) => {
        const certNumber = c.certificateNumber || c.id || 'CERT-2026-000001';
        const token = c.verificationToken || crypto.randomUUID();
        const url = c.verificationUrl || `${baseUrl}/verify/${token}`;

        if (!c.certificateNumber || !c.verificationUrl) {
          modified = true;
        }

        return {
          ...c,
          id: certNumber,
          certificateNumber: certNumber,
          verificationToken: token,
          verificationUrl: url,
        };
      });

      if (modified) {
        localStorage.setItem(CERT_KEY, JSON.stringify(normalized));
        localStorage.setItem(LEGACY_CERT_KEY, JSON.stringify(normalized));
      }

      // Sort descending by created date
      return normalized.sort((a: Certificate, b: Certificate) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  },

  getCertificateById: (id: string): Certificate | undefined => {
    const certs = storage.getCertificates();
    return certs.find(c => c.id === id || c.certificateNumber === id);
  },

  getCertificateByToken: (token: string): Certificate | undefined => {
    const certs = storage.getCertificates();
    const cleanToken = decodeURIComponent(token).trim();
    return certs.find(c => c.verificationToken === cleanToken);
  },

  saveCertificates: (newCerts: Certificate[]) => {
    const certs = storage.getCertificates();
    const updated = [...certs, ...newCerts];
    localStorage.setItem(CERT_KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY_CERT_KEY, JSON.stringify(updated));
  },

  updateCertificateStatus: (id: string, status: Certificate['status']) => {
    const certs = storage.getCertificates();
    const updated = certs.map(c => (c.id === id || c.certificateNumber === id) ? { ...c, status } : c);
    localStorage.setItem(CERT_KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY_CERT_KEY, JSON.stringify(updated));
  },

  getNextCertificateIndex: (): number => {
    const certs = storage.getCertificates();
    return certs.length + 1;
  },

  // Imports
  getImports: (): ImportRecord[] => {
    const data = localStorage.getItem(IMPORT_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data).sort((a: ImportRecord, b: ImportRecord) => 
        new Date(b.importDate).getTime() - new Date(a.importDate).getTime()
      );
    } catch {
      return [];
    }
  },

  saveImport: (record: ImportRecord) => {
    const imports = storage.getImports();
    localStorage.setItem(IMPORT_KEY, JSON.stringify([...imports, record]));
  },

  // Initialization
  initDemoData: () => {
    const existing = localStorage.getItem(CERT_KEY) || localStorage.getItem(LEGACY_CERT_KEY);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Already initialized
          return;
        }
      } catch {
        // Continue to init
      }
    }

    const baseUrl = getBaseUrl();

    // Helper to create valid demo certificate with consistent verificationToken & verificationUrl
    const createDemoCert = (
      certNumber: string,
      recipientName: string,
      certificateTitle: string,
      courseName: string,
      issueDate: string,
      organization: string,
      certificateType: string,
      email: string,
      status: 'VALID' | 'REVOKED',
      offsetMs: number
    ): Certificate => {
      const verificationToken = crypto.randomUUID();
      const verificationUrl = `${baseUrl}/verify/${verificationToken}`;
      return {
        id: certNumber,
        certificateNumber: certNumber,
        verificationToken,
        verificationUrl,
        recipientName,
        certificateTitle,
        courseName,
        issueDate,
        organization,
        certificateType,
        email,
        status,
        createdAt: new Date(Date.now() - offsetMs).toISOString(),
      };
    };

    const demoCerts: Certificate[] = [
      createDemoCert(
        'CERT-2026-000001',
        'Alice Johnson',
        'Certificate of Completion',
        'Advanced React Patterns',
        '2026-08-15',
        'Frontend Masters',
        'Completion',
        'alice@example.com',
        'VALID',
        10000000
      ),
      createDemoCert(
        'CERT-2026-000002',
        'Bob Smith',
        'Professional Certification',
        'Fullstack Web Development',
        '2026-08-10',
        'Tech Academy',
        'Professional',
        'bob@example.com',
        'VALID',
        20000000
      ),
      createDemoCert(
        'CERT-2026-000003',
        'Charlie Davis',
        'Certificate of Attendance',
        'UI/UX Design Workshop',
        '2026-08-01',
        'Design Institute',
        'Attendance',
        'charlie@example.com',
        'REVOKED',
        30000000
      ),
      createDemoCert(
        'CERT-2026-000004',
        'Diana Prince',
        'Master Certification',
        'Cloud Architecture',
        '2026-07-20',
        'Cloud Providers Inc',
        'Master',
        'diana@example.com',
        'VALID',
        40000000
      ),
      createDemoCert(
        'CERT-2026-000005',
        'Ethan Hunt',
        'Certificate of Excellence',
        'Cybersecurity Fundamentals',
        '2026-07-15',
        'Security Agency',
        'Excellence',
        'ethan@example.com',
        'VALID',
        50000000
      ),
    ];

    localStorage.setItem(CERT_KEY, JSON.stringify(demoCerts));
    localStorage.setItem(LEGACY_CERT_KEY, JSON.stringify(demoCerts));

    const demoImports: ImportRecord[] = [
      {
        id: crypto.randomUUID(),
        fileName: 'bootcamp_grads_2026.xlsx',
        importDate: new Date(Date.now() - 60000000).toISOString(),
        totalRows: 5,
        successfulRows: 5,
        failedRows: 0,
        status: 'COMPLETED',
      }
    ];
    localStorage.setItem(IMPORT_KEY, JSON.stringify(demoImports));
  }
};
