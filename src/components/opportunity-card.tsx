"use client";

import { useState, useTransition } from "react";
import { formatDate } from "@/lib/utils";

type Opportunity = {
  id: string;
  name: string;
  description: string;
  date: string; // ISO
  createdBy: string;
};

export function OpportunityCard({
  opp,
  clubId,
  canEdit,
  past,
  onUpdate,
  onDelete,
}: {
  opp: Opportunity;
  clubId: string;
  canEdit: boolean;
  past: boolean;
  onUpdate: (clubId: string, oppId: string, formData: FormData) => Promise<void>;
  onDelete: (clubId: string, oppId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await onUpdate(clubId, opp.id, formData);
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${opp.name}"?`)) return;
    startTransition(async () => {
      await onDelete(clubId, opp.id);
    });
  }

  const containerClass = past
    ? "rounded-lg border border-gray-100 bg-gray-50 p-4"
    : "rounded-lg border border-gray-200 bg-white p-4";

  if (editing) {
    return (
      <div className={containerClass}>
        <form action={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="name"
              type="text"
              required
              defaultValue={opp.name}
              placeholder="Opportunity name"
              className="col-span-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              name="date"
              type="date"
              required
              defaultValue={opp.date.split("T")[0]}
              className="col-span-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <textarea
            name="description"
            required
            rows={2}
            defaultValue={opp.description}
            placeholder="Description"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${containerClass}`}>
      <div className="min-w-0 flex-1">
        <h3 className={`font-medium ${past ? "text-gray-600" : "text-gray-900"}`}>
          {opp.name}
        </h3>
        <p className={`text-sm ${past ? "text-gray-400" : "text-gray-500"}`}>
          {opp.description}
        </p>
        <p className="mt-1 text-xs text-gray-400">{formatDate(opp.date)}</p>
      </div>
      <div className="flex shrink-0 gap-3">
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
