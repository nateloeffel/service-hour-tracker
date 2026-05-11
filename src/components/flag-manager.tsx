"use client";

import { useState, useTransition } from "react";
import { FlagPill, FLAG_COLOR_PALETTE } from "./flag-pill";

type Flag = { id: string; name: string; color: string };

const COLOR_DOTS: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
  purple: "bg-purple-500",
  gray: "bg-gray-400",
};

export function FlagManager({
  clubId,
  flags,
  onCreate,
  onDelete,
}: {
  clubId: string;
  flags: Flag[];
  onCreate: (clubId: string, formData: FormData) => Promise<void>;
  onDelete: (clubId: string, flagId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("color", color);
    setError(null);
    startTransition(async () => {
      try {
        await onCreate(clubId, formData);
        setName("");
        setColor("blue");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create flag");
      }
    });
  }

  function handleDelete(flagId: string, flagName: string) {
    if (
      !confirm(
        `Delete the "${flagName}" flag? It will be removed from all students.`,
      )
    )
      return;
    startTransition(async () => {
      await onDelete(clubId, flagId);
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <div>
          <h2 className="font-semibold text-gray-900">Flags</h2>
          <p className="text-xs text-gray-500">
            Tag students (e.g. &ldquo;First Semester&rdquo;) to track different
            requirement groups.
          </p>
        </div>
        <span className="text-sm text-gray-400">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5">
          {/* Existing flags */}
          {flags.length === 0 ? (
            <p className="text-sm text-gray-500">No flags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {flags.map((f) => (
                <span key={f.id} className="inline-flex items-center gap-1">
                  <FlagPill name={f.name} color={f.color} />
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id, f.name)}
                    disabled={isPending}
                    className="text-xs text-gray-400 hover:text-red-600"
                    aria-label={`Delete ${f.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Create new */}
          <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Flag name"
              maxLength={30}
              className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex items-center gap-1">
              {FLAG_COLOR_PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full ${COLOR_DOTS[c]} ${
                    color === c ? "ring-2 ring-offset-2 ring-gray-700" : ""
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={!name.trim() || isPending}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add Flag
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
