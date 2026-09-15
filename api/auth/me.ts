import { currentUser } from "../_lib/auth";
interface Request { method?: string; headers?: { cookie?: string }; }
interface Response { status: (code: number) => Response; json: (body: unknown) => void; }
export default async function handler(req: Request, res: Response) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await currentUser(req.headers?.cookie);
  return user ? res.status(200).json(user) : res.status(401).json({ error: "Not authenticated." });
}
