import { parseJson, query, serverError } from '../_lib/db';

interface Request {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}

interface Response {
  status: (code: number) => Response;
  json: (body: unknown) => void;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const value = req.query.verificationToken;
  const token = decodeURIComponent(Array.isArray(value) ? value[0] || '' : value || '').trim();
  if (!token) return res.status(400).json({ error: 'Verification token is required.' });

  try {
    const rows = await query<Record<string, unknown>>(
      'SELECT document_number, short_id, verification_token, recipient_name, document_title, course_name, issue_date, organization, document_type, status, dynamic_data, created_at FROM documents WHERE verification_token = ? AND deleted_at IS NULL',
      [token],
    );
    const document = rows[0];
    if (!document) return res.status(404).json({ error: 'Document not found.' });
    return res.status(200).json({
      success: true,
      id: document.short_id,
      documentNumber: document.document_number,
      shortId: document.short_id,
      verificationToken: document.verification_token,
      recipientName: document.recipient_name,
      documentTitle: document.document_title,
      courseName: document.course_name,
      issueDate: document.issue_date,
      organization: document.organization,
      documentType: document.document_type,
      status: document.status,
      dynamicData: parseJson(document.dynamic_data, {}),
      createdAt: document.created_at,
    });
  } catch (error) {
    return res.status(500).json({ error: serverError(error) });
  }
}
