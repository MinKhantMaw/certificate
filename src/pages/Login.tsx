import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storage } from "../services/storage";
import { FileBadge, Lock, Mail } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TRAINER" | "APPROVER">("ADMIN");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const demo =
      role === "ADMIN"
        ? email === "admin@example.com"
        : role === "TRAINER"
          ? email === "trainer@example.com"
          : email === "approver@example.com";
    if (demo && password === "admin123") {
      storage.login(email, role);
      navigate("/dashboard");
    } else {
      setError(
        "Invalid credentials. Use the demo email for the selected role and password admin123.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#002c76] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center" aria-label="Kanva home">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e11e26] text-white shadow-lg shadow-[#001f52]/40">
            <FileBadge className="w-8 h-8" />
          </span>
        </Link>
        <p className="mt-4 text-center text-sm font-semibold tracking-[0.2em] text-white">
          Kanva
        </p>
        <h2 className="mt-3 text-center text-3xl font-extrabold tracking-tight text-white">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-[#001f52]/40 sm:rounded-2xl sm:px-10 border border-white/80">
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="mt-1 block w-full border-gray-300 rounded-md py-2 border px-3"
              >
                <option value="ADMIN">Administrator</option>
                <option value="TRAINER">Trainer</option>
                <option value="APPROVER">Approver</option>
              </select>
            </div> */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-[#0054a6] focus:border-[#0054a6] block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 border"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-[#0054a6] focus:border-[#0054a6] block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 border"
                  placeholder="admin123"
                />
              </div>
            </div>

            {error && (
              <div className="text-[#b51f26] text-sm bg-[#fff1f1] p-2 rounded border border-[#ffb8bb] text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0054a6] hover:bg-[#003f82] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0054a6] transition-colors"
              >
                Sign in
              </button>
            </div>

            {/* <div className="mt-4 text-center text-xs text-gray-500">
              Demo Credentials:
              <br />
              Admin: <strong>admin@example.com</strong>
              <br />
              Trainer: <strong>trainer@example.com</strong>
              <br />
              Approver: <strong>approver@example.com</strong>
              <br />
              Password: <strong>admin123</strong>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}
