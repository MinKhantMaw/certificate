interface VercelRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

const documents = [
  {
    id: 'DOC-2026-000001', documentNumber: 'DOC-2026-000001',
    verificationToken: '00000000-0000-4000-8000-000000000001', recipientName: 'Alice Johnson',
    documentTitle: 'Document of Completion', courseName: 'Advanced React Patterns',
    issueDate: '2026-08-15', organization: 'Frontend Masters', documentType: 'Completion',
    email: 'alice@example.com', status: 'VALID', createdAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'DOC-2026-000002', documentNumber: 'DOC-2026-000002',
    verificationToken: '00000000-0000-4000-8000-000000000002', recipientName: 'Bob Smith',
    documentTitle: 'Professional Certification', courseName: 'Fullstack Web Development',
    issueDate: '2026-08-10', organization: 'Tech Academy', documentType: 'Professional',
    email: 'bob@example.com', status: 'VALID', createdAt: '2026-08-10T00:00:00.000Z',
  },
  {
    id: 'DOC-2026-000003', documentNumber: 'DOC-2026-000003',
    verificationToken: '00000000-0000-4000-8000-000000000003', recipientName: 'Charlie Davis',
    documentTitle: 'Document of Attendance', courseName: 'UI/UX Design Workshop',
    issueDate: '2026-08-01', organization: 'Design Institute', documentType: 'Attendance',
    email: 'charlie@example.com', status: 'REVOKED', createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'DOC-2026-000004', documentNumber: 'DOC-2026-000004',
    verificationToken: '00000000-0000-4000-8000-000000000004', recipientName: 'Diana Prince',
    documentTitle: 'Master Certification', courseName: 'Cloud Architecture',
    issueDate: '2026-07-20', organization: 'Cloud Providers Inc', documentType: 'Master',
    email: 'diana@example.com', status: 'VALID', createdAt: '2026-07-20T00:00:00.000Z',
  },
  {
    id: 'DOC-2026-000005', documentNumber: 'DOC-2026-000005',
    verificationToken: '00000000-0000-4000-8000-000000000005', recipientName: 'Ethan Hunt',
    documentTitle: 'Document of Excellence', courseName: 'Cybersecurity Fundamentals',
    issueDate: '2026-07-15', organization: 'Security Agency', documentType: 'Excellence',
    email: 'ethan@example.com', status: 'VALID', createdAt: '2026-07-15T00:00:00.000Z',
  },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const queryToken = req.query.verificationToken;
  const token = Array.isArray(queryToken) ? queryToken[0] : queryToken;
  const document = documents.find(item => item.verificationToken === token);

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  return res.status(200).json(document);
}