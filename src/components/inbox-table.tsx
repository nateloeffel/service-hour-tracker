"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Submission = {
  id: string;
  activityName: string;
  date: string;
  hours: number;
  status: string;
  description: string | null;
  studentName: string;
};

export function InboxTable({
  submissions,
  clubId,
  onApprove,
  onReject,
  onBulkApprove,
}: {
  submissions: Submission[];
  clubId: string;
  onApprove: (clubId: string, hourId: string) => Promise<void>;
  onReject: (clubId: string, hourId: string, reason: string) => Promise<void>;
  onBulkApprove: (clubId: string, hourIds: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const pendingIds = submissions.filter((s) => s.status === "PENDING").map((s) => s.id);
  const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingIds));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleApprove(hourId: string) {
    startTransition(async () => {
      await onApprove(clubId, hourId);
    });
  }

  function handleReject(hourId: string) {
    if (!rejectReason.trim()) return;
    startTransition(async () => {
      await onReject(clubId, hourId, rejectReason);
      setRejectingId(null);
      setRejectReason("");
    });
  }

  function handleBulkApprove() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      await onBulkApprove(clubId, ids);
      setSelected(new Set());
    });
  }

  return (
    <div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-600 lg:hidden">
          <input
            type="checkbox"
            className="rounded"
            checked={allSelected}
            onChange={toggleAll}
          />
          Select all
        </label>
        <button
          onClick={handleBulkApprove}
          disabled={selected.size === 0 || isPending}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Approve Selected ({selected.size})
        </button>
      </div>

      {/* Desktop table */}
      <div className="mt-2 hidden overflow-x-auto rounded-lg border border-gray-200 bg-white lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Activity</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hours</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {submissions.map((s) => (
              <tr key={s.id}>
                <td className="w-10 px-3 py-3">
                  {s.status === "PENDING" && (
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{s.studentName}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div>{s.activityName}</div>
                  {s.description && (
                    <div className="text-xs text-gray-500">{s.description}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.date)}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{s.hours}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">
                  {s.status === "PENDING" && (
                    <ActionButtons
                      id={s.id}
                      rejectingId={rejectingId}
                      rejectReason={rejectReason}
                      isPending={isPending}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onStartReject={setRejectingId}
                      onReasonChange={setRejectReason}
                      onCancelReject={() => { setRejectingId(null); setRejectReason(""); }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-2 space-y-3 lg:hidden">
        {submissions.map((s) => (
          <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start gap-3">
              {s.status === "PENDING" && (
                <input
                  type="checkbox"
                  className="mt-1 rounded"
                  checked={selected.has(s.id)}
                  onChange={() => toggleOne(s.id)}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-900">{s.studentName}</p>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-1 text-sm text-gray-900">{s.activityName}</p>
                {s.description && (
                  <p className="mt-0.5 text-xs text-gray-500">{s.description}</p>
                )}
                <div className="mt-2 flex gap-3 text-xs text-gray-500">
                  <span>{formatDate(s.date)}</span>
                  <span>{s.hours} hrs</span>
                </div>
                {s.status === "PENDING" && (
                  <div className="mt-3">
                    <ActionButtons
                      id={s.id}
                      rejectingId={rejectingId}
                      rejectReason={rejectReason}
                      isPending={isPending}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onStartReject={setRejectingId}
                      onReasonChange={setRejectReason}
                      onCancelReject={() => { setRejectingId(null); setRejectReason(""); }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButtons({
  id,
  rejectingId,
  rejectReason,
  isPending,
  onApprove,
  onReject,
  onStartReject,
  onReasonChange,
  onCancelReject,
}: {
  id: string;
  rejectingId: string | null;
  rejectReason: string;
  isPending: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onStartReject: (id: string) => void;
  onReasonChange: (reason: string) => void;
  onCancelReject: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onApprove(id)}
        disabled={isPending}
        className="rounded bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
      >
        Approve
      </button>
      {rejectingId === id ? (
        <div className="flex flex-wrap items-center gap-1">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Reason..."
            className="w-32 rounded border border-gray-300 px-2 py-1 text-xs sm:w-36"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onReject(id);
              if (e.key === "Escape") onCancelReject();
            }}
          />
          <button
            onClick={() => onReject(id)}
            disabled={!rejectReason.trim() || isPending}
            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            onClick={onCancelReject}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => onStartReject(id)}
          className="rounded bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          Reject
        </button>
      )}
    </div>
  );
}
