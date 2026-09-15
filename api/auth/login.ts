import { ensureUser, sessionCookie } from "../_lib/auth";
interface Request { method?: string; body?: { email?: string; password?: string }; }
interface Response { setHeader: (name: string, value: string) => void; status: (code: number) => Response; json: (body: unknown) => void; }
export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password || "";
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  try {
    const user = await ensureUser(email, password);
    if (!user) return res.status(401).json({ error: "Invalid credentials." });
    res.setHeader("Set-Cookie", sessionCookie(user.id));
    return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch { return res.status(503).json({ error: "Authentication service unavailable." }); }
}
