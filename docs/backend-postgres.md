# PostgreSQL backend

The server-side API uses PostgreSQL database `yse`. Configure `DATABASE_URL` or the `PG*` variables from `.env.example`.

Start PostgreSQL, create the database if needed, and apply the schema:

```sql
CREATE DATABASE yse;
```

```powershell
$env:DATABASE_URL = "postgresql://postgres:password@127.0.0.1:5432/yse"
npm run db:migrate
```

The backend routes are:

- `GET /api/health`
- `GET|POST /api/templates`
- `GET|PUT|DELETE /api/templates/:id`
- `GET /api/documents`
- `GET|PATCH|DELETE /api/documents/:id`
- `POST /api/imports`
- `GET /api/verify/:verificationToken`

`POST /api/imports` accepts parsed rows from the existing Excel importer:

```json
{
  "templateId": "template-id",
  "fileName": "roster.xlsx",
  "uploadedBy": "user-id",
  "rows": [
    {
      "recipient_name": "John Doe",
      "email": "john@example.com",
      "issue_date": "2026-09-08",
      "dynamicData": { "department": "Engineering" }
    }
  ]
}
```

Document generation and its import rows are committed in one transaction. QR encryption is called only when the selected template contains a QR element. The existing browser PNG and ZIP rendering remains unchanged until the frontend API adapter is enabled.
