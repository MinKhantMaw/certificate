import { randomUUID } from 'node:crypto';
import { query, transaction, serverError } from '../_lib/db';
import { encryptQr } from '../_lib/encrypt';
import { ImportedRow, shortId, verificationUrl } from '../_lib/documents';

interface Request { method?: string; body?: unknown; }
interface Response { status: (code: number) => Response; json: (body: unknown) => void; }

export default async function handler(req: Request, res: Response) {
  if (req.method === 'GET') {
    try {
      const rows = await query<Record<string, unknown>>('SELECT id, template_id, file_name, total_rows, valid_rows, invalid_rows, status, uploaded_by, submitted_at, created_at, updated_at FROM import_batches ORDER BY submitted_at DESC');
      return res.status(200).json(rows.map((row) => ({ id: row.id, templateId: row.template_id, fileName: row.file_name, totalRows: row.total_rows, validRows: row.valid_rows, invalidRows: row.invalid_rows, status: row.status, uploadedBy: row.uploaded_by, submittedAt: row.submitted_at, createdAt: row.created_at, updatedAt: row.updated_at })));
    } catch (error) { return res.status(500).json({ error: serverError(error) }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const input = req.body as { templateId?: string; fileName?: string; uploadedBy?: string; rows?: ImportedRow[] } | undefined;
  if (!input?.templateId || !input.rows?.length || input.rows.some((row) => !row.recipient_name || !row.email)) return res.status(400).json({ error: 'An active template and valid rows are required.' });
  try {
    const templates = await query<Record<string, unknown>>('SELECT id, layout, status FROM templates WHERE id = ?', [input.templateId]);
    const template = templates[0];
    if (!template || template.status !== 'ACTIVE') return res.status(400).json({ error: 'Select an active document template before generation.' });
    const layout = typeof template.layout === 'string' ? JSON.parse(template.layout) : template.layout as { elements?: Array<{ type?: string }> };
    const hasQr = Boolean(layout?.elements?.some((element) => element.type === 'qr'));
    const timestamp = new Date();
    const batchId = randomUUID();
    const documents = await transaction(async (connection) => {
      await connection.query("INSERT INTO import_batches (id, template_id, file_name, total_rows, valid_rows, invalid_rows, status, uploaded_by, submitted_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, 0, 'COMPLETED', $6, $7, $8, $9)", [batchId, input.templateId, input.fileName || 'import.xlsx', input.rows!.length, input.rows!.length, input.uploadedBy || null, timestamp, timestamp, timestamp]);
      const created = [];
      for (let index = 0; index < input.rows!.length; index += 1) {
        const row = input.rows![index];
        const id = randomUUID();
        const number = `DOC-${timestamp.getFullYear()}-${String(index + 1).padStart(6, '0')}-${id.slice(0, 4).toUpperCase()}`;
        const token = randomUUID();
        const dynamicData = row.dynamicData || {};
        const qr = hasQr ? await encryptQr({ cert_id: number, recipient: row.recipient_name!, issued_at: row.issue_date || timestamp.toISOString().slice(0, 10) }) : undefined;
        const document = { id, documentNumber: number, shortId: shortId(), verificationToken: token, verificationUrl: verificationUrl(token), recipientName: row.recipient_name!, documentTitle: row.document_title || 'Document of Completion', courseName: row.course_name || '', issueDate: row.issue_date || timestamp.toISOString().slice(0, 10), organization: row.organization || '', documentType: row.document_type || 'completion', email: row.email!, status: 'VALID', documentTemplateId: input.templateId, dynamicData, encryptedQrUrl: qr?.qrUrl, encryptedQrToken: qr?.token };
        await connection.query('INSERT INTO documents (id, document_number, short_id, verification_token, template_id, import_batch_id, recipient_name, document_title, course_name, issue_date, organization, document_type, email, status, dynamic_data, encrypted_qr_url, encrypted_qr_token, encrypted_qr_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)', [id, number, document.shortId, token, input.templateId, batchId, document.recipientName, document.documentTitle, document.courseName, document.issueDate, document.organization, document.documentType, document.email, document.status, JSON.stringify(dynamicData), qr?.qrUrl || null, qr?.token || null, qr ? timestamp : null, timestamp, timestamp]);
        await connection.query("INSERT INTO import_rows (id, import_batch_id, row_number, data, validation_errors, validation_status, document_id, created_at) VALUES ($1, $2, $3, $4, $5, 'VALID', $6, $7)", [randomUUID(), batchId, index + 1, JSON.stringify(row), JSON.stringify([]), id, timestamp]);
        created.push(document);
      }
      return created;
    });
    return res.status(201).json({ batchId, documents });
  } catch (error) { return res.status(500).json({ error: serverError(error) }); }
}