import { clearSessionCookie } from "../_lib/auth";
interface Request { method?: string; }
interface Response { setHeader: (name: string, value: string) => void; status: (code: number) => Response; json: (body: unknown) => void; }
export default function handler(req: Request, res: Response) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.status(204).json({});
}
