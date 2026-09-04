import { ChangeEvent, useState } from "react";
import { ImagePlus, Trash2, UserRound } from "lucide-react";
import { storage } from "../services/storage";

export function SignatureProfile() {
  const current = storage.getUser();
  const [user, setUser] = useState(current);
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !["image/png", "image/jpeg"].includes(file.type))
      return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = {
        ...user,
        signatureImage: String(reader.result),
        signatureUploadedAt: new Date().toISOString(),
      };
      storage.updateUser(updated);
      setUser(updated);
    };
    reader.readAsDataURL(file);
  };
  const remove = () => {
    if (!user) return;
    const updated = {
      ...user,
      signatureImage: undefined,
      signatureUploadedAt: undefined,
    };
    storage.updateUser(updated);
    setUser(updated);
  };
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
          Identity & signing
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          My signature
        </h2>
        <p className="mt-2 text-slate-500">
          Your signature is only added to certificates when your approval is
          recorded.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <UserRound />
          </div>
          <div>
            <p className="font-semibold text-slate-950">{user?.name}</p>
            <p className="text-sm text-slate-500">
              {user?.email} · {user?.role}
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
          {user?.signatureImage ? (
            <img
              src={user.signatureImage}
              alt="Your signature"
              className="mx-auto h-24 max-w-full object-contain"
            />
          ) : (
            <ImagePlus className="mx-auto text-slate-300" size={42} />
          )}
          <p className="mt-3 text-sm text-slate-500">
            PNG or JPG, preferably a transparent PNG
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <label className="cursor-pointer rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              {user?.signatureImage ? "Replace signature" : "Upload signature"}
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={upload}
                className="hidden"
              />
            </label>
            {user?.signatureImage && (
              <button
                onClick={remove}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
              >
                <Trash2 size={16} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
